/**
 * Invitation service — invite by email or phone, accept/reject/revoke.
 *
 * Config drives the policy: `join.invitation.allow` per org type, match
 * strictness on accept, `join.legalConsent` recorded against the org type.
 * WHO may invite/list/revoke is the AC engine (allowCreate/allowUpdate +
 * resolved read scopes); accept/reject stay identifier-matched (UOM2/UOM5).
 */

import { PRIVATE, type Ac, type Private, type Public } from "@libs/gated-scoped-ac";
import type {
  AuthAndRegistrationConfig,
  OrgLifecycleEntry,
} from "../../shared/auth-config/types";
import type { ScopedAcRequestContext } from "../shared/scoped-ac";
import { inviteChannelsFor } from "../shared/invite-channels";
import type {
  InvitationPublicView,
  InvitationView,
  MyInvitationView,
} from "../../shared/types/domain";
import type { UomInvitationSelect } from "../models/invitation.model";
import type { IdentityProviderPort } from "../identity/identity-provider.port";
import type { InvitationRepository } from "../repositories/invitation.repository";
import type { InvitationDelivery } from "../mount-types";
import type { UserOrgMgmtHooks } from "../../shared/types/hooks";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import {
  findOrgLifecycle,
  orgTypeLabel,
  requireOrgLifecycle,
} from "../shared/org-lifecycle";
import type { ConsentDecision, ConsentRecordService } from "./consent-record.service";
import type { LegalDocumentService } from "./legal-document.service";
import type { MembershipService } from "./membership.service";
import type { OrganizationService } from "./organization.service";
import type { UserService } from "./user.service";

/** Fallback when the org type's `join.invitation.expiresInSeconds` is unset. */
const DEFAULT_INVITATION_EXPIRES_SECONDS = 48 * 60 * 60;

export interface InvitationServiceDeps {
  invitationRepo: InvitationRepository;
  membershipService: Pick<MembershipService, "addMember">;
  organizationService: Pick<OrganizationService, "getOrg" | "assertOrg">;
  /** The config-bound engine (AC37: injected). Mints the read/update Scopes the
   * repo executes and the create/update verdicts. */
  engine: Pick<Ac, "resolveRead" | "resolveUpdate" | "allowCreate" | "allowUpdate">;
  userService: Pick<UserService, "identityIdOf" | "getProfile">;
  port: IdentityProviderPort;
  legalDocumentService: Pick<LegalDocumentService, "itemsWithDocuments">;
  consentRecordService: Pick<ConsentRecordService, "recordConsent">;
  orgConfig: OrgLifecycleEntry[];
  authConfig: AuthAndRegistrationConfig;
  delivery?: InvitationDelivery;
  hooks: UserOrgMgmtHooks;
  errors: ModuleErrors;
  logger: ModuleLogger;
}

export class InvitationService {
  constructor(private readonly deps: InvitationServiceDeps) {}

  /** Invite an identifier (email XOR phone) into an org. */
  async create(
    orgId: string,
    ac: ScopedAcRequestContext,
    visibility: Private,
    input: { email?: string; phone?: string; roles: string[] },
  ): Promise<InvitationView> {
    const inviterUserId = ac.bag.session.user.id;
    // business rule: assignable role must not exceed caller's — DSL has no
    // cross-role comparison (AC35).
    // Create gates on a verdict (AC9, AC33) — there is no row to scope. The
    // rule's context answers "may the caller invite in this org context at
    // all"; its payload is checked against the invitation about to be written
    // (`$requestBody`), so the config decides which org it may be for.
    const verdict = this.deps.engine.allowCreate(ac.permissions, "invitation", {
      ...ac.bag,
      requestBody: { organizationId: orgId, ...input },
    });
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(verdict.reason ?? "cannot invite members");
    }
    const org = await this.deps.organizationService.assertOrg(visibility, orgId);
    const entry = this.lifecycleOf(org.type);
    if (!entry.join?.invitation.allow) {
      throw this.deps.errors.badRequest(
        `${entry.label} organizations don't accept invitations`,
      );
    }
    if (!!input.email === !!input.phone) {
      throw this.deps.errors.badRequest(
        "provide exactly one of email or phone",
      );
    }

    const channel = input.email ? "email" : "phone";
    if (!inviteChannelsFor(this.deps.authConfig, org.type).includes(channel)) {
      throw this.deps.errors.badRequest(
        `${entry.label} invitations can't be sent by ${channel}`,
      );
    }

    const expiresInSeconds =
      entry.join.invitation.expiresInSeconds ??
      DEFAULT_INVITATION_EXPIRES_SECONDS;
    const invitation = await this.deps.invitationRepo.create(visibility, {
      organizationId: orgId,
      email: input.email ?? null,
      phone: input.phone ?? null,
      roles: input.roles,
      inviterId: inviterUserId,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    });
    await this.deliver(visibility, invitation, org.name, entry.label, inviterUserId);
    return toView(invitation);
  }

  async getAllByOrgIds(
    ac: ScopedAcRequestContext,
    visibility: Private,
    orgId: string,
  ): Promise<InvitationView[]> {
    await this.deps.organizationService.assertOrg(visibility, orgId);
    // Read pass-through (AC5): the engine resolves which invitation rows are
    // visible, the repo executes the Scope over the org.
    const scope = this.deps.engine.resolveRead(
      ac.permissions,
      "invitation",
      ac.bag,
    );
    const rows = await this.deps.invitationRepo.findAllByOrgIds(
      visibility,
      [orgId],
      scope,
      ac.gateDb,
    );
    return rows.map(toView);
  }

  async revoke(
    ac: ScopedAcRequestContext,
    visibility: Private,
    orgId: string,
    invitationId: string,
  ): Promise<void> {
    await this.deps.organizationService.assertOrg(visibility, orgId);
    const invitation =
      (await this.deps.invitationRepo.findByIds(visibility, [invitationId]))[0] ??
      null;
    if (!invitation || invitation.organizationId !== orgId) {
      throw this.deps.errors.notFound("invitation not found");
    }
    if (invitation.status !== "pending") {
      throw this.deps.errors.badRequest("invitation is no longer pending");
    }
    // Cheap in-memory column verdict first (AC10), then the scoped row write —
    // the caller's update Scope must admit this invitation. null ⇒ denied.
    const verdict = this.deps.engine.allowUpdate(
      ac.permissions,
      "invitation",
      { status: "revoked" },
      ac.bag,
    );
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(verdict.reason ?? "cannot revoke invitation");
    }
    const scope = this.deps.engine.resolveUpdate(
      ac.permissions,
      "invitation",
      ac.bag,
    );
    const updated = await this.deps.invitationRepo.updateScoped(
      visibility,
      invitationId,
      "revoked",
      scope,
      ac.gateDb,
    );
    if (!updated) throw this.deps.errors.forbidden("cannot revoke this invitation");
  }

  /** Capability-URL projection for the accept page — no auth. AC42: Public —
   * this IS the pre-session/no-auth branch (`GET /invitations/:id` mints no
   * user context), even though the my-orgs router is otherwise private. */
  async getPublicView(
    visibility: Public,
    invitationId: string,
  ): Promise<InvitationPublicView> {
    const invitation =
      (await this.deps.invitationRepo.findByIds(visibility, [invitationId]))[0] ??
      null;
    if (!invitation) throw this.deps.errors.notFound("invitation not found");
    // Join consent shown pre-accept so the page collects decisions up front.
    const { organization, joinConsent } = await this.invitationContext(
      visibility,
      invitation,
    );
    return {
      id: invitation.id,
      organizationName: organization.name,
      organizationLogo: organization.logo,
      orgType: organization.type,
      orgTypeLabel: organization.typeLabel,
      roles: invitation.roles,
      status: invitation.status,
      identifier: invitation.email ?? invitation.phone ?? "",
      expiresAt: invitation.expiresAt.toISOString(),
      joinConsent,
    };
  }

  /** Pending, unexpired invitations addressed to the caller's identifiers —
   * each with the org it is from and whether accepting needs the org type's
   * join consent (see `invitationContext`). */
  async getInvitationsByUserId(
    visibility: Private,
    userId: string,
  ): Promise<MyInvitationView[]> {
    // `ownedIdentifiers` stays token-less (rule 5, accept/reject internals) in
    // every call site, this one included.
    const owned = await this.ownedIdentifiers(userId);
    const rows = await this.deps.invitationRepo.findAllByUserIdentifiers(
      visibility,
      {
        emails: owned.emails,
        phones: owned.phones,
      },
    );
    return Promise.all(
      rows.map(async (invitation) => {
        const { organization, requiresConsent } = await this.invitationContext(
          visibility,
          invitation,
        );
        return { ...toView(invitation), organization, requiresConsent };
      }),
    );
  }

  /** What an invitation shows beyond its own row — one read path for the
   * public capability view and the caller's own list: the inviting org (with
   * fallbacks when it no longer exists or its type is undeclared — a read
   * never throws on that), the org type's join consent paired with its
   * current documents, and whether accepting needs decisions on it (a
   * mandatory item whose document is published; unpublished ones are
   * waived, as `accept` waives them). */
  private async invitationContext(
    visibility: Public,
    invitation: UomInvitationSelect,
  ): Promise<{
    organization: MyInvitationView["organization"];
    joinConsent: InvitationPublicView["joinConsent"];
    requiresConsent: boolean;
  }> {
    const org = await this.deps.organizationService.getOrg(
      visibility,
      invitation.organizationId,
    );
    const entry = org ? findOrgLifecycle(this.deps.orgConfig, org.type) : undefined;
    const joinConsent = org
      ? await this.deps.legalDocumentService.itemsWithDocuments(
          visibility,
          entry?.join?.legalConsent ?? [],
          org.type,
        )
      : [];
    return {
      organization: {
        id: invitation.organizationId,
        name: org?.name ?? "an organization",
        logo: org?.logo ?? null,
        type: org?.type ?? "",
        typeLabel: org ? orgTypeLabel(this.deps.orgConfig, org.type) : "",
      },
      joinConsent,
      requiresConsent: joinConsent.some(
        (item) => item.consent && item.mandatory && item.document !== null,
      ),
    };
  }

  /** Signed-in accept — match strictness enforced, org consent recorded.
   * AC42: private. The identifier-matching internals (`findPendingInvitation`,
   * `ownedIdentifiers`, `identifierMatches`) and the raw accept/reject write
   * stay token-less (rule 5); `membershipService.addMember` is threaded
   * normally. */
  async accept(
    visibility: Private,
    userId: string,
    invitationId: string,
    consents?: ConsentDecision[],
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const { invitation, entry, org } =
      await this.findPendingInvitation(invitationId);

    const owned = await this.ownedIdentifiers(userId);
    if (!this.identifierMatches(invitation, entry, owned)) {
      throw this.deps.errors.forbidden(
        "this invitation was sent to a different address",
      );
    }

    if (entry.join?.legalConsent?.length) {
      await this.deps.consentRecordService.recordConsent({
        userId,
        items: entry.join.legalConsent,
        decisions: consents ?? [],
        orgTypeId: org.type,
        context: "gate",
        ...meta,
      });
    }

    await this.deps.membershipService.addMember(
      visibility,
      invitation.organizationId,
      userId,
      invitation.roles,
    );
    await this.deps.invitationRepo.update(
      invitation.id,
      "accepted",
      userId,
    );
    await this.emitAccepted(invitation, org.name, userId);
  }

  async reject(
    visibility: Private,
    userId: string,
    invitationId: string,
  ): Promise<void> {
    void visibility; // nothing downstream to thread — both internals are exempt
    const { invitation, entry } =
      await this.findPendingInvitation(invitationId);
    const owned = await this.ownedIdentifiers(userId);
    if (!this.identifierMatches(invitation, entry, owned)) {
      throw this.deps.errors.forbidden(
        "this invitation was sent to a different address",
      );
    }
    await this.deps.invitationRepo.update(
      invitation.id,
      "rejected",
      userId,
    );
  }

  // ── internals ──────────────────────────────────────────────────────────────

  /**
   * Announce the acceptance. Fired after the status commit, so the membership
   * stands whether or not a consumer succeeds — the awaited callback is the
   * app's to keep safe (its `fireSafely` wrapper), same as every other hook on
   * this seam. No consumer wired means no profile read.
   */
  private async emitAccepted(
    invitation: UomInvitationSelect,
    orgName: string,
    accepterUserId: string,
  ): Promise<void> {
    if (!this.deps.hooks.onInvitationAccepted) return;
    // AC42: private — the hook fires from the signed-in accept path, never a
    // public flow, so the safe default is minted directly (same rule as the
    // accept/reject internals below).
    const accepter = await this.deps.userService.getProfile(
      PRIVATE,
      accepterUserId,
    );
    await this.deps.hooks.onInvitationAccepted({
      invitationId: invitation.id,
      organizationId: invitation.organizationId,
      orgName,
      inviterUserId: invitation.inviterId,
      accepterUserId,
      accepterName: accepter?.name ?? null,
      role: invitation.roles.join(", "),
    });
  }

  // AC42: `findPendingInvitation`, `identifierMatches`, and `ownedIdentifiers`
  // are the accept/reject identifier-matched invitation internals (rule 5) —
  // token-less regardless of caller. Where they must call a token-requiring
  // method, they mint the safe default (`PRIVATE`) directly, since none of
  // their callers is ever a public flow.

  private async findPendingInvitation(invitationId: string): Promise<{
    invitation: UomInvitationSelect;
    entry: OrgLifecycleEntry;
    // `name` rides along for the acceptance hook — assertOrg already read it.
    org: { id: string; type: string; name: string };
  }> {
    const invitation =
      (await this.deps.invitationRepo.findByIds(PRIVATE, [invitationId]))[0] ??
      null;
    if (!invitation) throw this.deps.errors.notFound("invitation not found");
    if (invitation.status !== "pending") {
      throw this.deps.errors.badRequest("invitation is no longer pending");
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw this.deps.errors.badRequest("invitation has expired");
    }
    const org = await this.deps.organizationService.assertOrg(
      PRIVATE,
      invitation.organizationId,
    );
    return { invitation, entry: this.lifecycleOf(org.type), org };
  }

  private identifierMatches(
    invitation: UomInvitationSelect,
    entry: OrgLifecycleEntry,
    owned: OwnedIdentifiers,
  ): boolean {
    if (invitation.email) {
      const strict = entry.join?.invitation.strictEmailMatch ?? true;
      return strict
        ? owned.emails.includes(invitation.email)
        : owned.emails.length > 0;
    }
    if (invitation.phone) {
      const strict = entry.join?.invitation.strictPhoneMatch ?? true;
      return strict
        ? owned.phones.includes(invitation.phone)
        : owned.phones.length > 0;
    }
    return false;
  }

  private async ownedIdentifiers(userId: string): Promise<OwnedIdentifiers> {
    const identityId = await this.deps.userService.identityIdOf(
      PRIVATE,
      userId,
    );
    const identity = await this.deps.port.getIdentity(identityId);
    return {
      identityId,
      addresses: identity.addresses,
      emails: identity.addresses
        .filter((a) => a.via === "email")
        .map((a) => a.value),
      phones: identity.addresses
        .filter((a) => a.via === "sms")
        .map((a) => a.value),
    };
  }

  private async deliver(
    visibility: Private,
    invitation: UomInvitationSelect,
    organizationName: string,
    orgTypeLabel: string,
    inviterUserId: string,
  ): Promise<void> {
    if (!this.deps.delivery) {
      this.deps.logger.warn("no invitation delivery configured — not sent", {
        invitationId: invitation.id,
      });
      return;
    }
    const inviterProfile = await this.deps.userService.getProfile(
      visibility,
      inviterUserId,
    );
    const payload = {
      invitationId: invitation.id,
      organizationName,
      orgTypeLabel,
      roles: invitation.roles,
      inviterName: inviterProfile?.name ?? null,
      expiresAt: invitation.expiresAt.toISOString(),
    };
    try {
      if (invitation.email) {
        await this.deps.delivery.sendEmail(invitation.email, payload);
      } else if (invitation.phone) {
        await this.deps.delivery.sendSms(invitation.phone, payload);
      }
    } catch (error) {
      // Delivery failure never rolls back the invitation — its capability URL
      // still works.
      this.deps.logger.error("invitation delivery failed", {
        invitationId: invitation.id,
        error,
      });
    }
  }

  /** The org type's lifecycle rules — an unknown type is a 400. */
  private lifecycleOf(orgType: string): OrgLifecycleEntry {
    return requireOrgLifecycle(this.deps.orgConfig, orgType, this.deps.errors);
  }
}

interface OwnedIdentifiers {
  identityId: string;
  addresses: Array<{ via: "email" | "sms"; value: string; verified: boolean }>;
  emails: string[];
  phones: string[];
}

function toView(invitation: UomInvitationSelect): InvitationView {
  return {
    id: invitation.id,
    email: invitation.email,
    phone: invitation.phone,
    roles: invitation.roles,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  };
}
