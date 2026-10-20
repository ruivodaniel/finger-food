/**
 * Organization service — create/read/update under the org-lifecycle config.
 *
 * The config decides WHAT an org type allows (actor, singleton, ownership,
 * consent); WHO may call each operation is the AC engine — allowCreate/
 * allowUpdate verdicts plus resolved read scopes (AC5/AC6/AC9).
 */

import type { Ac, Private, Public } from "@libs/gated-scoped-ac";
import type {
  AuthAndRegistrationConfig,
  OrgLifecycleEntry,
} from "../../shared/auth-config/types";
import type { ScopedAcRequestContext } from "../shared/scoped-ac";
import type {
  OrganizationDirectoryListView,
  OrganizationView,
} from "../../shared/types/domain";
import type { UomOrganizationSelect } from "../models/organization.model";
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "../models/organization.schemas";
import type {
  FindAllOrganizationsQuery,
  OrganizationRepository,
} from "../repositories/organization.repository";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import { imageExtensionOf, type StoragePort } from "../shared/storage-port";
import { orgTypeLabel, requireOrgLifecycle } from "../shared/org-lifecycle";
import { toOrganizationView } from "../shared/organization-view";
import type { ConsentDecision, ConsentRecordService } from "./consent-record.service";
import type { MembershipService } from "./membership.service";

export interface OrganizationServiceDeps {
  orgRepo: OrganizationRepository;
  membershipService: Pick<MembershipService, "addMember">;
  consentRecordService: Pick<ConsentRecordService, "recordConsent">;
  /** The config-bound engine (AC37: injected, never constructed here). Mints the
   * read/update Scopes the repo executes and the create/update verdicts. */
  engine: Pick<
    Ac,
    "resolveRead" | "resolveUpdate" | "allowUpdate" | "allowCreate"
  >;
  storage: StoragePort;
  orgConfig: OrgLifecycleEntry[];
  authConfig: AuthAndRegistrationConfig;
  errors: ModuleErrors;
  logger: ModuleLogger;
}

export class OrganizationService {
  constructor(private readonly deps: OrganizationServiceDeps) {}

  /**
   * Create per the lifecycle entry: user-actor types only, singletons at most
   * once, creator seated as owner when the ownership mode says so (otherwise
   * ownerless until an invited owner claims it), creation consent recorded.
   */
  async create(
    ac: ScopedAcRequestContext,
    visibility: Private,
    input: CreateOrganizationInput & { consents?: ConsentDecision[] },
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<OrganizationView> {
    const userId = ac.bag.session.user.id;
    // Create gates on the parent-context verdict (AC9, AC33): create rules carry
    // no target, so this only answers "may this caller found an org at all".
    const verdict = this.deps.engine.allowCreate(
      ac.permissions,
      "organization",
      ac.bag,
    );
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(
        verdict.reason ?? "cannot create organization",
      );
    }
    const orgTypeConfig = this.lifecycleOf(input.type);
    // business rule (UOM17): privileged/system org types are never creatable via
    // the API — this is lifecycle policy, not authorization.
    if (orgTypeConfig.creation.actor !== "user") {
      throw this.deps.errors.forbidden(
        `${orgTypeConfig.label} organizations are provisioned by the platform`,
      );
    }
    if (orgTypeConfig.isSingleInstance) {
      const existing = await this.deps.orgRepo.countByType(
        visibility,
        orgTypeConfig.orgType,
      );
      if (existing > 0) {
        throw this.deps.errors.badRequest(
          `only one ${orgTypeConfig.label} organization can exist`,
        );
      }
    }

    const ownership = orgTypeConfig.creation.ownership;
    const creatorIsOwner = ownership?.mode.includes("creator") ?? false;
    if (ownership?.legalConsent?.length && creatorIsOwner) {
      await this.deps.consentRecordService.recordConsent({
        userId,
        items: ownership.legalConsent,
        decisions: input.consents ?? [],
        orgTypeId: orgTypeConfig.orgType,
        context: "gate",
        ...meta,
      });
    }

    const org = await this.deps.orgRepo.create(visibility, {
      type: input.type,
      name: input.name,
      logo: input.logo,
      metadata: input.metadata,
    });
    if (ownership && creatorIsOwner) {
      await this.deps.membershipService.addMember(visibility, org.id, userId, [
        ownership.membershipOwnerRole,
      ]);
    }
    return this.toView(org);
  }

  async getById(
    ac: ScopedAcRequestContext,
    visibility: Private,
    orgId: string,
  ): Promise<OrganizationView> {
    // Read is a pass-through (AC5): the engine resolves the read Scope, the repo
    // executes it. No row admitted ⇒ 404-shaped miss (existence + access fused).
    const scope = this.deps.engine.resolveRead(
      ac.permissions,
      "organization",
      ac.bag,
    );
    const [org] = await this.deps.orgRepo.findByIdsScoped(
      visibility,
      [orgId],
      scope,
      ac.gateDb,
    );
    if (!org) throw this.deps.errors.notFound("organization not found");
    return this.toView(org);
  }

  async update(
    ac: ScopedAcRequestContext,
    visibility: Private,
    orgId: string,
    patch: UpdateOrganizationInput,
  ): Promise<OrganizationView> {
    // Cheap in-memory column verdict first (AC10), then the scoped row write.
    const verdict = this.deps.engine.allowUpdate(
      ac.permissions,
      "organization",
      patch,
      ac.bag,
    );
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(verdict.reason ?? "cannot update organization");
    }
    const scope = this.deps.engine.resolveUpdate(
      ac.permissions,
      "organization",
      ac.bag,
    );
    const updated = await this.deps.orgRepo.update(
      visibility,
      orgId,
      patch,
      scope,
      ac.gateDb,
    );
    // null ⇒ the Scope admitted no such row (denied, AC6/AC9).
    if (!updated) throw this.deps.errors.forbidden("cannot update organization");
    return this.toView(updated);
  }

  /**
   * Presign the org's logo upload. The server derives the key — the client
   * never chooses storage paths. The returned publicUrl is what
   * `update({ logo })` stores after the browser PUTs the bytes.
   */
  async presignLogoUpload(
    ac: ScopedAcRequestContext,
    visibility: Private,
    orgId: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    await this.assertOrg(visibility, orgId);
    // Presigning is an update-intent on the org (the client later stores the
    // logo via `update`), gated like that update: the in-memory column verdict
    // first (AC10), then the row — there is no write here, so the update Scope
    // is probed instead of fused (AC9). No admitted row ⇒ forbidden.
    const verdict = this.deps.engine.allowUpdate(
      ac.permissions,
      "organization",
      { logo: "" },
      ac.bag,
    );
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(verdict.reason ?? "cannot update organization");
    }
    const scope = this.deps.engine.resolveUpdate(
      ac.permissions,
      "organization",
      ac.bag,
    );
    const admitted = await this.deps.orgRepo.findRowsByIdWhereCanUpdate(
      visibility,
      orgId,
      scope,
      ac.gateDb,
    );
    if (admitted.length === 0) {
      throw this.deps.errors.forbidden("cannot update organization");
    }
    const extension = imageExtensionOf(contentType);
    if (!extension) {
      throw this.deps.errors.badRequest("unsupported image type");
    }
    return this.deps.storage.presignPut(
      `public/organizations/${orgId}/logo/${Date.now()}.${extension}`,
      contentType,
    );
  }

  /** The org types a user may found — user-actor lifecycle entries. Which types
   * are creatable is a business/config concern (UOM17); the permission to create
   * at all is the account baseline, gated per caller in `create`. */
  creatableTypes(visibility: Private): Array<{ id: string; label: string }> {
    void visibility; // no repo/service call to thread into — config only
    return this.deps.orgConfig
      .filter((entry) => entry.creation.actor === "user")
      .map((entry) => ({ id: entry.orgType, label: entry.label }));
  }

  /** Every declared org type ({ id, label }) — the directory filter's options. */
  organizationTypes(visibility: Private): Array<{ id: string; label: string }> {
    void visibility; // no repo/service call to thread into — config only
    return this.deps.orgConfig.map((entry) => ({
      id: entry.orgType,
      label: entry.label,
    }));
  }

  /** The platform directory — name-searchable and paginated, row-scoped by the
   * engine (a company member sees only their org; a system admin sees all). */
  async getAll(
    ac: ScopedAcRequestContext,
    visibility: Private,
    query: FindAllOrganizationsQuery,
  ): Promise<OrganizationDirectoryListView> {
    // Read pass-through (AC5): the engine resolves the read Scope, the repo
    // executes it and composes the directory query over the admitted ids.
    const scope = this.deps.engine.resolveRead(
      ac.permissions,
      "organization",
      ac.bag,
    );
    const { rows, total } = await this.deps.orgRepo.findAll(
      visibility,
      query,
      scope,
      ac.gateDb,
    );
    return {
      rows: rows.map((org) => ({
        id: org.id,
        name: org.name,
        logo: org.logo,
        type: org.type,
        typeLabel: orgTypeLabel(this.deps.orgConfig, org.type),
        status:
          typeof org.metadata?.status === "string"
            ? org.metadata.status
            : "active",
      })),
      total,
    };
  }

  // ── Narrow accessors — the only door to organization rows for other
  // services ────────────────────────────────────────────────────────────────

  /** The bare org row, or null — no membership check; callers decide what
   * absence means. AC42: Public — the public invitation capability view
   * (`invitationService.getPublicView`) reaches this alongside private
   * callers (`ownerRoleFor`, `presignLogoUpload`); Public is the loosest
   * demand covering all of them. */
  async getOrg(
    visibility: Public,
    orgId: string,
  ): Promise<UomOrganizationSelect | null> {
    const [org] = await this.deps.orgRepo.findByIds(visibility, [orgId]);
    return org ?? null;
  }

  /** The org row, or a 404 — the throwing counterpart to `getOrg`. AC42:
   * demands Private — every caller is a private flow (private-by-default;
   * `getOrg` stays the public-reachable read). */
  async assertOrg(
    visibility: Private,
    orgId: string,
  ): Promise<UomOrganizationSelect> {
    const org = await this.getOrg(visibility, orgId);
    if (!org) throw this.deps.errors.notFound("organization not found");
    return org;
  }

  /** The org type's lifecycle rules — an unknown type is a 400. */
  private lifecycleOf(orgType: string): OrgLifecycleEntry {
    return requireOrgLifecycle(this.deps.orgConfig, orgType, this.deps.errors);
  }

  private toView(org: UomOrganizationSelect): OrganizationView {
    return toOrganizationView(org, this.deps.orgConfig, this.deps.authConfig);
  }
}
