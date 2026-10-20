/**
 * Membership service — member management and the gate's membership facts.
 *
 * Config-driven checks (last-owner protection) live here; WHO may manage
 * members is the AC engine — allowUpdate verdicts, resolved read scopes,
 * and the delete-scope probe (AC5/AC6/AC9/AC10).
 */

import { PRIVATE, type Ac, type Private } from "@libs/gated-scoped-ac";
import type {
  AuthAndRegistrationConfig,
  OrgLifecycleEntry,
} from "../../shared/auth-config/types";
import type { ScopedAcRequestContext } from "../shared/scoped-ac";
import type {
  MemberListView,
  MembershipFacts,
  MembershipView,
} from "../../shared/types/domain";
import type { UomMembershipSelect } from "../models/membership.model";
import type {
  MembershipRepository,
  PageMembersQuery,
} from "../repositories/membership.repository";
import type { ModuleErrors } from "../shared/module-errors";
import { findOrgLifecycle } from "../shared/org-lifecycle";
import { toOrganizationView } from "../shared/organization-view";
import type { OrganizationService } from "./organization.service";

export interface MembershipServiceDeps {
  membershipRepo: MembershipRepository;
  /** Thunk: membership and organization reference each other (org type for
   * last-owner protection here, owner seating there); mount wires the cycle. */
  organizationService: () => Pick<OrganizationService, "getOrg">;
  /** The config-bound engine (AC37: injected). Mints the read/update/delete
   * Scopes the repo executes and the update column verdict. */
  engine: Pick<Ac, "resolveRead" | "resolveUpdate" | "resolveDelete" | "allowUpdate">;
  orgConfig: OrgLifecycleEntry[];
  authConfig: AuthAndRegistrationConfig;
  errors: ModuleErrors;
}

export class MembershipService {
  constructor(private readonly deps: MembershipServiceDeps) {}

  /** An org's members — name-searchable, paginated, default contact joined. */
  async getAllByOrgIds(
    ac: ScopedAcRequestContext,
    visibility: Private,
    orgId: string,
    query: PageMembersQuery,
  ): Promise<MemberListView> {
    // Read pass-through (AC5): the engine resolves which membership rows are
    // visible, the repo executes the Scope and enriches the admitted ids.
    const scope = this.deps.engine.resolveRead(
      ac.permissions,
      "membership",
      ac.bag,
    );
    const { rows, total } = await this.deps.membershipRepo.findAllByOrgIds(
      visibility,
      [orgId],
      query,
      scope,
      ac.gateDb,
    );
    return {
      rows: rows.map(({ member, name, image, contact }) => ({
        userId: member.userId,
        name,
        contact,
        image,
        roles: member.roles,
        createdAt: member.createdAt.toISOString(),
      })),
      total,
    };
  }

  async updateRoles(
    ac: ScopedAcRequestContext,
    visibility: Private,
    orgId: string,
    targetUserId: string,
    roles: string[],
  ): Promise<void> {
    // business rule: assignable role must not exceed caller's — DSL has no
    // cross-role comparison (AC35).
    // Cheap in-memory column verdict first (AC10) — denies a caller with no
    // applicable member-management permission before any row lookup.
    const verdict = this.deps.engine.allowUpdate(
      ac.permissions,
      "membership",
      { roles },
      ac.bag,
    );
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(verdict.reason ?? "cannot manage members");
    }
    const target = await this.assertMembership(visibility, orgId, targetUserId);

    const configuredOwnerRole = await this.ownerRoleFor(visibility, orgId);
    if (
      configuredOwnerRole &&
      target.roles.includes(configuredOwnerRole) &&
      !roles.includes(configuredOwnerRole) &&
      (await this.countOwners(visibility, orgId, configuredOwnerRole)) <= 1
    ) {
      throw this.deps.errors.badRequest(
        "an organization keeps at least one owner",
      );
    }
    // The scoped write is the row-level gate: it touches the target only when
    // the caller's update Scope admits it. null ⇒ denied (AC6/AC9).
    const scope = this.deps.engine.resolveUpdate(
      ac.permissions,
      "membership",
      ac.bag,
    );
    const updated = await this.deps.membershipRepo.updateScoped(
      visibility,
      target.id,
      roles,
      scope,
      ac.gateDb,
    );
    if (!updated) throw this.deps.errors.forbidden("cannot manage this member");
  }

  /** Remove a member (self-removal included) — never the last owner. */
  async remove(
    ac: ScopedAcRequestContext,
    visibility: Private,
    orgId: string,
    targetUserId: string,
  ): Promise<void> {
    const callerUserId = ac.bag.session.user.id;
    const target = await this.assertMembership(visibility, orgId, targetUserId);

    const configuredOwnerRole = await this.ownerRoleFor(visibility, orgId);
    if (
      configuredOwnerRole &&
      target.roles.includes(configuredOwnerRole) &&
      (await this.countOwners(visibility, orgId, configuredOwnerRole)) <= 1
    ) {
      throw this.deps.errors.badRequest(
        "an organization keeps at least one owner",
      );
    }

    if (targetUserId === callerUserId) {
      // business rule: a member may always leave (self-removal), even without
      // member-management permission — the DSL has no self-leave rule (AC35).
      await this.deps.membershipRepo.delete(visibility, target.id);
      return;
    }

    // Managing ANOTHER member requires the delete grant. Removal is a soft
    // delete, so the delete-scope probe is the row-level check (no allowDelete
    // verdict): no admitted rows ⇒ denied (AC9), else the soft delete runs.
    const scope = this.deps.engine.resolveDelete(
      ac.permissions,
      "membership",
      ac.bag,
    );
    const admitted = await this.deps.membershipRepo.findRowsByIdWhereCanDelete(
      visibility,
      target.id,
      scope,
      ac.gateDb,
    );
    if (admitted.length === 0) {
      throw this.deps.errors.forbidden("cannot remove this member");
    }
    await this.deps.membershipRepo.delete(visibility, target.id);
  }

  /** The caller's membership facts — org id + type + roles (gate input, active-org reconcile).
   * AC42: token-less — session resolution (rule 5); passes `PRIVATE` directly
   * into `findAllByUserIds`, which is also genuinely threaded from
   * `getAllMembershipsByUserId` (never split a signature for this). */
  async getMembershipFactsByUserId(userId: string): Promise<MembershipFacts[]> {
    const rows = await this.deps.membershipRepo.findAllByUserIds(PRIVATE, [
      userId,
    ]);
    return rows.map(({ member, organization }) => ({
      organizationId: organization.id,
      orgType: organization.type,
      roles: member.roles,
    }));
  }

  /** The caller's memberships as client views — the `/me/memberships` read. */
  async getAllMembershipsByUserId(
    visibility: Private,
    userId: string,
  ): Promise<MembershipView[]> {
    const rows = await this.deps.membershipRepo.findAllByUserIds(visibility, [
      userId,
    ]);
    return rows.map(({ member, organization }) => ({
      organization: toOrganizationView(
        organization,
        this.deps.orgConfig,
        this.deps.authConfig,
      ),
      roles: member.roles,
      createdAt: member.createdAt.toISOString(),
    }));
  }

  // ── Narrow accessors — the only door to member rows for other services ──

  /** The caller's membership in an org — forbidden when they have none. */
  async assertMembership(
    visibility: Private,
    orgId: string,
    userId: string,
  ): Promise<UomMembershipSelect> {
    const member = await this.deps.membershipRepo.findByOrgIdAndUserId(
      visibility,
      orgId,
      userId,
    );
    if (!member) throw this.deps.errors.forbidden("not a member");
    return member;
  }

  /** Seat a member: create the row, or merge roles into an existing one (re-invite = union). */
  async addMember(
    visibility: Private,
    orgId: string,
    userId: string,
    roles: string[],
  ): Promise<void> {
    const existing = await this.deps.membershipRepo.findByOrgIdAndUserId(
      visibility,
      orgId,
      userId,
    );
    if (existing) {
      const merged = [...new Set([...existing.roles, ...roles])];
      await this.deps.membershipRepo.update(visibility, existing.id, merged);
    } else {
      await this.deps.membershipRepo.create(visibility, {
        organizationId: orgId,
        userId,
        roles,
      });
    }
  }

  // ── internals ──────────────────────────────────────────────────────────────

  /** The type's owner role — null for types without an ownership block. */
  private async ownerRoleFor(
    visibility: Private,
    orgId: string,
  ): Promise<string | null> {
    const org = await this.deps.organizationService().getOrg(visibility, orgId);
    if (!org) throw this.deps.errors.notFound("organization not found");
    const entry = findOrgLifecycle(this.deps.orgConfig, org.type);
    return entry?.creation.ownership?.membershipOwnerRole ?? null;
  }

  private async countOwners(
    visibility: Private,
    orgId: string,
    ownerRole: string,
  ): Promise<number> {
    return this.deps.membershipRepo.countByRole(visibility, orgId, ownerRole);
  }
}
