/**
 * In-memory repository implementations — test doubles for docker-free unit
 * tests. They honor the repository interfaces exactly; no persistence.
 */

import { createFakeStorage } from "./fake-storage";

import {
  PRIVATE,
  type Ac,
  type GatedDb,
  type Private,
  type Public,
  type Scope,
  type SchemaTables,
} from "@libs/gated-scoped-ac";
import type { ScopedAcBag, ScopedAcRequestContext } from "../shared/scoped-ac";
import type {
  LegalDocumentPatch,
  LegalDocumentRepository,
  SaveDraftRecord,
} from "../repositories/legal-document.repository";
import type {
  ConsentRecordRepository,
  CreateConsentRecord,
} from "../repositories/consent-record.repository";
import type { UserRepository } from "../repositories/user.repository";
import type {
  ProfilePatch,
  UserProfileRepository,
} from "../repositories/user-profile.repository";
import type {
  CreateUserContactRecord,
  UserContactRepository,
} from "../repositories/user-contact.repository";
import type {
  PreferencesPatch,
  UserPreferencesRepository,
} from "../repositories/user-preferences.repository";
import type { UomUserProfileSelect } from "../models/user.model";
import type { UomUserPreferencesSelect } from "../models/user-preferences.model";
import type {
  CreateOrganizationRecord,
  FindAllOrganizationsQuery,
  OrganizationPatch,
  OrganizationRepository,
} from "../repositories/organization.repository";
import type {
  MembershipRepository,
  MembershipWithOrganization,
  PageMembersQuery,
} from "../repositories/membership.repository";
import type {
  CreateInvitationRecord,
  InvitationRepository,
} from "../repositories/invitation.repository";
import type { UomOrganizationSelect } from "../models/organization.model";
import type { UomMembershipSelect } from "../models/membership.model";
import type {
  InvitationStatus,
  UomInvitationSelect,
} from "../models/invitation.model";
import type { UomConsentRecordSelect } from "../models/consent-record.model";
import type { UomLegalDocumentSelect } from "../models/legal.model";
import type { UomUserContactSelect, UomUserSelect } from "../models/user.model";
import type { LegalConsentType } from "../../shared/auth-config/types";
import { UserProfileService } from "../services/user-profile.service";
import { UserContactService } from "../services/user-contact.service";

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${++seq}`;

export class InMemoryUserRepository implements UserRepository {
  users = new Map<string, UomUserSelect>();

  async create(input: { identityId: string }): Promise<UomUserSelect> {
    const user: UomUserSelect = {
      id: nextId("user"),
      identityId: input.identityId,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    this.users.set(user.id, user);
    return user;
  }

  async findByIds(
    _visibility: Public,
    ids: string[],
  ): Promise<UomUserSelect[]> {
    return ids
      .map((id) => this.users.get(id))
      .filter((u): u is UomUserSelect => u !== undefined && u.deletedAt === null);
  }

  async findByIdentityId(identityId: string): Promise<UomUserSelect | null> {
    for (const user of this.users.values()) {
      if (user.identityId === identityId && user.deletedAt === null) return user;
    }
    return null;
  }

  async delete(
    id: string,
    _scope: Scope<"user", "delete">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<void> {
    const user = this.users.get(id);
    if (user) user.deletedAt = new Date();
  }
}

export class InMemoryUserProfileRepository implements UserProfileRepository {
  profiles = new Map<string, UomUserProfileSelect>();

  async create(userId: string): Promise<void> {
    this.profiles.set(userId, {
      userId,
      name: null,
      image: null,
      data: {},
      updatedAt: new Date(),
    });
  }

  async findAllByUserIds(
    _visibility: Public,
    userIds: string[],
  ): Promise<UomUserProfileSelect[]> {
    return userIds
      .map((id) => this.profiles.get(id))
      .filter((p): p is UomUserProfileSelect => p !== undefined);
  }

  // Scope + gated handle ignored in-memory (no runnable SQL); the permissive
  // `testEngine` makes every AC call pass so business logic is what's tested.
  async findAllByUserIdsScoped(
    userIds: string[],
    _scope: Scope<"user_profile", "read">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserProfileSelect[]> {
    return this.findAllByUserIds(PRIVATE, userIds);
  }

  async update(userId: string, patch: ProfilePatch): Promise<void> {
    // A real user always has a profile row (seeded at create); if a test seeds
    // the user directly, materialize it here so update is not a silent no-op.
    let p = this.profiles.get(userId);
    if (!p) {
      p = { userId, name: null, image: null, data: {}, updatedAt: new Date() };
      this.profiles.set(userId, p);
    }
    if (patch.name !== undefined) p.name = patch.name;
    if (patch.image !== undefined) p.image = patch.image;
    if (patch.data !== undefined) p.data = { ...p.data, ...patch.data };
  }

  async updateScoped(
    _visibility: Private,
    userId: string,
    patch: ProfilePatch,
    _scope: Scope<"user_profile", "update">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserProfileSelect | null> {
    let p = this.profiles.get(userId);
    if (!p) {
      p = { userId, name: null, image: null, data: {}, updatedAt: new Date() };
      this.profiles.set(userId, p);
    }
    if (patch.name !== undefined) p.name = patch.name;
    if (patch.image !== undefined) p.image = patch.image;
    if (patch.data !== undefined) p.data = { ...p.data, ...patch.data };
    p.updatedAt = new Date();
    return p;
  }

  async delete(
    userId: string,
    _scope: Scope<"user_profile", "delete">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<void> {
    this.profiles.delete(userId);
  }
}

// Scope + gated handle ignored in-memory (no runnable SQL); `testEngine` allows.
export class InMemoryUserPreferencesRepository implements UserPreferencesRepository {
  rows = new Map<string, UomUserPreferencesSelect>();

  async findByUserIdScoped(
    userId: string,
    _scope: Scope<"user_preferences", "read">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserPreferencesSelect | null> {
    return this.rows.get(userId) ?? null;
  }

  async createScoped(
    userId: string,
    patch: PreferencesPatch,
    _permissions: Iterable<string>,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserPreferencesSelect | null> {
    const row: UomUserPreferencesSelect = {
      userId,
      localeSource: null,
      localeValue: null,
      timezoneSource: null,
      timezoneValue: null,
      currencyValue: null,
      countryValue: null,
      ...patch,
      updatedAt: new Date(),
    };
    this.rows.set(userId, row);
    return row;
  }

  async updateScoped(
    userId: string,
    patch: PreferencesPatch,
    _scope: Scope<"user_preferences", "update">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserPreferencesSelect | null> {
    const row = this.rows.get(userId);
    if (!row) return null;
    Object.assign(row, patch, { updatedAt: new Date() });
    return row;
  }
}

export class InMemoryUserContactRepository implements UserContactRepository {
  contacts: UomUserContactSelect[] = [];

  async create(input: CreateUserContactRecord): Promise<UomUserContactSelect> {
    const row: UomUserContactSelect = {
      id: nextId("contact"),
      userId: input.userId,
      contact: input.contact,
      isDefault: input.isDefault,
      createdAt: new Date(),
    };
    this.contacts.push(row);
    return row;
  }

  async findAllByUserIds(userIds: string[]): Promise<UomUserContactSelect[]> {
    return this.contacts.filter((c) => userIds.includes(c.userId));
  }

  // Scope + gated handle ignored in-memory (no runnable SQL); `testEngine` allows.
  async findAllByUserIdsScoped(
    userIds: string[],
    _scope: Scope<"user_contact", "read">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserContactSelect[]> {
    return this.findAllByUserIds(userIds);
  }

  async delete(
    id: string,
    _scope: Scope<"user_contact", "delete">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<void> {
    this.contacts = this.contacts.filter((c) => c.id !== id);
  }
}

export class InMemoryLegalDocumentRepository
  implements LegalDocumentRepository
{
  documents: UomLegalDocumentSelect[] = [];

  async findLatestVersion(
    _visibility: Public,
    type: LegalConsentType,
    orgTypeId: string | null,
  ) {
    const candidates = this.documents
      .filter(
        (d) =>
          d.type === type &&
          (d.orgTypeId ?? null) === orgTypeId &&
          d.publishedAt,
      )
      .sort((a, b) => b.version - a.version);
    return candidates[0] ?? null;
  }

  async findByIds(_visibility: Public, ids: string[]) {
    return this.documents.filter((d) => ids.includes(d.id));
  }

  // Scope + gated handle ignored in-memory (no runnable SQL); `testEngine` allows.
  async findByIdsScoped(
    _visibility: Private,
    ids: string[],
    _scope: Scope<"legal_document", "read">,
    _gateDb: GatedDb<SchemaTables>,
  ) {
    return this.findByIds(PRIVATE, ids);
  }

  async findDraft(
    _visibility: Private,
    type: LegalConsentType,
    orgTypeId: string | null,
  ) {
    return (
      this.documents.find(
        (d) =>
          d.type === type &&
          (d.orgTypeId ?? null) === orgTypeId &&
          !d.publishedAt,
      ) ?? null
    );
  }

  async findAllByScope(
    _visibility: Private,
    type: LegalConsentType,
    orgTypeId: string | null,
    _scope: Scope<"legal_document", "read">,
    _gateDb: GatedDb<SchemaTables>,
  ) {
    return this.documents
      .filter((d) => d.type === type && (d.orgTypeId ?? null) === orgTypeId)
      .sort((a, b) => b.version - a.version);
  }

  async create(
    _visibility: Private,
    input: SaveDraftRecord,
  ): Promise<UomLegalDocumentSelect> {
    const versions = this.documents
      .filter(
        (d) => d.type === input.type && (d.orgTypeId ?? null) === input.orgTypeId,
      )
      .map((d) => d.version);
    const doc: UomLegalDocumentSelect = {
      id: nextId("doc"),
      type: input.type,
      orgTypeId: input.orgTypeId,
      version: Math.max(0, ...versions) + 1,
      title: input.title,
      contentHtml: input.contentHtml,
      publishedAt: null,
      createdAt: new Date(),
    };
    this.documents.push(doc);
    return doc;
  }

  async update(
    _visibility: Private,
    id: string,
    patch: LegalDocumentPatch,
    _scope: Scope<"legal_document", "update">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<UomLegalDocumentSelect | null> {
    const doc = this.documents.find((d) => d.id === id);
    if (!doc) return null;
    if (patch.title !== undefined) doc.title = patch.title;
    if (patch.contentHtml !== undefined) doc.contentHtml = patch.contentHtml;
    if (patch.publishedAt !== undefined) doc.publishedAt = patch.publishedAt;
    return doc;
  }

  async delete(
    id: string,
    _scope: Scope<"legal_document", "delete">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<void> {
    this.documents = this.documents.filter((d) => d.id !== id);
  }
}

export class InMemoryConsentRecordRepository
  implements ConsentRecordRepository
{
  consents: UomConsentRecordSelect[] = [];

  async create(input: CreateConsentRecord): Promise<void> {
    this.consents.push({
      id: nextId("consent"),
      userId: input.userId,
      legalDocumentId: input.document.id,
      legalDocumentType: input.document.type,
      legalDocumentVersion: input.document.version,
      orgTypeId: input.document.orgTypeId,
      context: input.context,
      consentedAt: new Date(),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  }

  async findAllByUserIds(userIds: string[]) {
    return this.consents.filter((c) => userIds.includes(c.userId));
  }
}

export class InMemoryOrganizationRepository implements OrganizationRepository {
  organizations = new Map<string, UomOrganizationSelect>();

  async create(
    _visibility: Private,
    input: CreateOrganizationRecord,
  ): Promise<UomOrganizationSelect> {
    const row: UomOrganizationSelect = {
      id: nextId("org"),
      type: input.type,
      name: input.name,
      logo: input.logo ?? null,
      metadata: input.metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    this.organizations.set(row.id, row);
    return row;
  }

  async findByIds(_visibility: Public, ids: string[]) {
    return ids
      .map((id) => this.organizations.get(id))
      .filter(
        (row): row is NonNullable<typeof row> =>
          row !== undefined && row.deletedAt === null,
      );
  }

  // Scope + gated handle are ignored in-memory (they carry no runnable SQL); the
  // permissive `testEngine` makes every AC call pass so business logic is tested.
  async findByIdsScoped(
    _visibility: Private,
    ids: string[],
    _scope: Scope<"organization", "read">,
    _gateDb: GatedDb<SchemaTables>,
  ) {
    return this.findByIds(PRIVATE, ids);
  }

  async countByType(_visibility: Private, type: string): Promise<number> {
    let total = 0;
    for (const org of this.organizations.values()) {
      if (org.type === type && org.deletedAt === null) total++;
    }
    return total;
  }

  async findAll(
    _visibility: Private,
    query: FindAllOrganizationsQuery,
    _scope: Scope<"organization", "read">,
    _gateDb: GatedDb<SchemaTables>,
  ) {
    const statusOf = (org: UomOrganizationSelect) =>
      typeof org.metadata?.status === "string" ? org.metadata.status : "active";
    const filtered = [...this.organizations.values()]
      .filter(
        (org) =>
          org.deletedAt === null &&
          (!query.search ||
            org.name.toLowerCase().includes(query.search.toLowerCase())) &&
          (!query.type || org.type === query.type) &&
          (!query.status || statusOf(org) === query.status),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    const start = (query.page - 1) * query.pageSize;
    return {
      rows: filtered.slice(start, start + query.pageSize),
      total: filtered.length,
    };
  }

  async update(
    _visibility: Private,
    id: string,
    patch: OrganizationPatch,
    _scope: Scope<"organization", "update">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<UomOrganizationSelect | null> {
    const row = this.organizations.get(id);
    if (!row) return null;
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.logo !== undefined) row.logo = patch.logo;
    if (patch.metadata !== undefined) row.metadata = patch.metadata;
    row.updatedAt = new Date();
    return row;
  }

  async findRowsByIdWhereCanUpdate(
    _visibility: Private,
    id: string,
    _scope: Scope<"organization", "update">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<Record<string, unknown>[]> {
    const row = this.organizations.get(id);
    return row && row.deletedAt === null ? [{ id: row.id }] : [];
  }

  async delete(id: string): Promise<void> {
    const row = this.organizations.get(id);
    if (row) row.deletedAt = new Date();
  }
}

export class InMemoryMembershipRepository implements MembershipRepository {
  members = new Map<string, UomMembershipSelect>();
  /** Wire the org repo in tests that exercise `getAllMembershipsByUserId`. */
  organizations: InMemoryOrganizationRepository | null = null;
  /** Wire the profile/contact fakes in tests that exercise `findAllByOrgIds`
   * (names/contacts) — those rows are their own entities now (API4). */
  userProfiles: InMemoryUserProfileRepository | null = null;
  userContacts: InMemoryUserContactRepository | null = null;

  async create(
    _visibility: Private,
    input: {
      organizationId: string;
      userId: string;
      roles: string[];
    },
  ): Promise<UomMembershipSelect> {
    const row: UomMembershipSelect = {
      id: nextId("member"),
      organizationId: input.organizationId,
      userId: input.userId,
      roles: input.roles,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    this.members.set(row.id, row);
    return row;
  }

  async findByIds(ids: string[]): Promise<UomMembershipSelect[]> {
    return ids
      .map((id) => this.members.get(id))
      .filter(
        (m): m is UomMembershipSelect => m !== undefined && m.deletedAt === null,
      );
  }

  async findAll(query: {
    page: number;
    pageSize: number;
    order: "asc" | "desc";
  }) {
    const dir = query.order === "asc" ? 1 : -1;
    const all = [...this.members.values()]
      .filter((m) => m.deletedAt === null)
      .sort((a, b) => dir * (a.createdAt.getTime() - b.createdAt.getTime()));
    const start = (query.page - 1) * query.pageSize;
    return { rows: all.slice(start, start + query.pageSize), total: all.length };
  }

  async findByOrgIdAndUserId(
    _visibility: Private,
    organizationId: string,
    userId: string,
  ) {
    for (const row of this.members.values()) {
      if (
        row.organizationId === organizationId &&
        row.userId === userId &&
        row.deletedAt === null
      ) {
        return row;
      }
    }
    return null;
  }

  async countByRole(
    _visibility: Private,
    organizationId: string,
    role: string,
  ): Promise<number> {
    return [...this.members.values()].filter(
      (row) =>
        row.organizationId === organizationId &&
        row.roles.includes(role) &&
        row.deletedAt === null,
    ).length;
  }

  async findAllByOrgIds(
    _visibility: Private,
    organizationIds: string[],
    query: PageMembersQuery,
    _scope: Scope<"membership", "read">,
    _gateDb: GatedDb<SchemaTables>,
  ) {
    const all = [...this.members.values()]
      .filter(
        (row) =>
          organizationIds.includes(row.organizationId) &&
          row.deletedAt === null,
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((member) => {
        const profile = this.userProfiles?.profiles.get(member.userId);
        const contact = this.userContacts?.contacts.find(
          (c) => c.userId === member.userId && c.isDefault,
        );
        return {
          member,
          name: profile?.name ?? null,
          image: profile?.image ?? null,
          contact: contact?.contact ?? null,
        };
      })
      .filter(
        (row) =>
          !query.search ||
          (row.name ?? "").toLowerCase().includes(query.search.toLowerCase()),
      );
    const start = (query.page - 1) * query.pageSize;
    return { rows: all.slice(start, start + query.pageSize), total: all.length };
  }

  async findAllByUserIds(
    _visibility: Private,
    userIds: string[],
  ): Promise<MembershipWithOrganization[]> {
    const rows: MembershipWithOrganization[] = [];
    for (const member of this.members.values()) {
      if (!userIds.includes(member.userId) || member.deletedAt !== null) continue;
      const organization = this.organizations?.organizations.get(
        member.organizationId,
      );
      if (organization && organization.deletedAt === null) {
        rows.push({ member, organization });
      }
    }
    return rows;
  }

  async update(
    _visibility: Private,
    id: string,
    roles: string[],
  ): Promise<void> {
    const row = this.members.get(id);
    if (row) row.roles = roles;
  }

  async updateScoped(
    _visibility: Private,
    id: string,
    roles: string[],
    _scope: Scope<"membership", "update">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<UomMembershipSelect | null> {
    const row = this.members.get(id);
    if (!row || row.deletedAt !== null) return null;
    row.roles = roles;
    row.updatedAt = new Date();
    return row;
  }

  async delete(_visibility: Private, id: string): Promise<void> {
    const row = this.members.get(id);
    if (row) row.deletedAt = new Date();
  }

  async findRowsByIdWhereCanDelete(
    _visibility: Private,
    id: string,
    _scope: Scope<"membership", "delete">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<Record<string, unknown>[]> {
    const row = this.members.get(id);
    return row && row.deletedAt === null ? [row] : [];
  }
}

export class InMemoryInvitationRepository implements InvitationRepository {
  invitations = new Map<string, UomInvitationSelect>();

  async create(
    _visibility: Private,
    input: CreateInvitationRecord,
  ): Promise<UomInvitationSelect> {
    const row: UomInvitationSelect = {
      id: nextId("invite"),
      organizationId: input.organizationId,
      email: input.email,
      phone: input.phone,
      roles: input.roles,
      status: "pending",
      inviterId: input.inviterId,
      invitedUserId: null,
      expiresAt: input.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invitations.set(row.id, row);
    return row;
  }

  async findByIds(_visibility: Public, ids: string[]) {
    return ids
      .map((id) => this.invitations.get(id))
      .filter((row): row is NonNullable<typeof row> => row !== undefined);
  }

  async findAll(query: {
    page: number;
    pageSize: number;
    order: "asc" | "desc";
  }) {
    const dir = query.order === "asc" ? 1 : -1;
    const all = [...this.invitations.values()].sort(
      (a, b) => dir * (a.createdAt.getTime() - b.createdAt.getTime()),
    );
    const start = (query.page - 1) * query.pageSize;
    return { rows: all.slice(start, start + query.pageSize), total: all.length };
  }

  async findAllByOrgIds(
    _visibility: Private,
    organizationIds: string[],
    _scope: Scope<"invitation", "read">,
    _gateDb: GatedDb<SchemaTables>,
  ): Promise<UomInvitationSelect[]> {
    return [...this.invitations.values()].filter((row) =>
      organizationIds.includes(row.organizationId),
    );
  }

  async findAllByUserIdentifiers(
    _visibility: Private,
    identifiers: {
      emails: string[];
      phones: string[];
    },
  ): Promise<UomInvitationSelect[]> {
    return [...this.invitations.values()].filter(
      (row) =>
        row.status === "pending" &&
        row.expiresAt.getTime() > Date.now() &&
        ((row.email !== null && identifiers.emails.includes(row.email)) ||
          (row.phone !== null && identifiers.phones.includes(row.phone))),
    );
  }

  async update(
    id: string,
    status: InvitationStatus,
    invitedUserId?: string,
  ): Promise<void> {
    const row = this.invitations.get(id);
    if (!row) return;
    row.status = status;
    if (invitedUserId !== undefined) row.invitedUserId = invitedUserId;
  }

  async updateScoped(
    _visibility: Private,
    id: string,
    status: InvitationStatus,
    _scope: Scope<"invitation", "update">,
    _gateDb: GatedDb<SchemaTables>,
    invitedUserId?: string,
  ): Promise<UomInvitationSelect | null> {
    const row = this.invitations.get(id);
    if (!row) return null;
    row.status = status;
    if (invitedUserId !== undefined) row.invitedUserId = invitedUserId;
    row.updatedAt = new Date();
    return row;
  }

  async delete(id: string): Promise<void> {
    this.invitations.delete(id);
  }
}

/** Seed a published document in one step (draft + publish). The gated update's
 * Scope + handle are inert here (the in-memory repo ignores them). */
export async function publishTestDoc(
  repo: InMemoryLegalDocumentRepository,
  input: SaveDraftRecord,
): Promise<UomLegalDocumentSelect> {
  const draft = await repo.create(PRIVATE, input);
  const publishedAt = new Date();
  await repo.update(
    PRIVATE,
    draft.id,
    { publishedAt },
    undefined as never,
    undefined as never,
  );
  return { ...draft, publishedAt };
}

export const testErrors = {
  notFound: (m?: string) => new Error(`404:${m}`),
  badRequest: (m?: string) => new Error(`400:${m}`),
  unauthorized: (m?: string) => new Error(`401:${m}`),
  forbidden: (m?: string) => new Error(`403:${m}`),
  internalError: (m?: string) => new Error(`500:${m}`),
};

export const testLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

/**
 * Permissive scoped-AC engine for the docker-free unit stack. Every resolve
 * returns an inert Scope (the in-memory repos ignore it) and every verdict
 * allows — so these tests exercise BUSINESS logic (consent, singletons,
 * last-owner, lifecycle) with AC out of the way. Deny-by-default enforcement is
 * proven separately against a real db (spec step 8).
 */
export const testEngine = {
  resolveRead: () => ({}) as never,
  resolveUpdate: () => ({}) as never,
  resolveDelete: () => ({}) as never,
  allowUpdate: () => ({ allow: true as const }),
  allowCreate: () => ({ allow: true as const }),
} as unknown as Ac;

/**
 * A request-scoped AC context for a caller (and optional active org). The bag
 * carries the subject id services read (`ac.bag.session.user.id`); permissions
 * and the gated handle are inert here — `testEngine` allows regardless, and the
 * in-memory repos never touch the handle.
 */
export function testAc(
  userId: string,
  org: { id: string; type: string } | null = null,
): ScopedAcRequestContext {
  const bag: ScopedAcBag = { session: { user: { id: userId }, organization: org } };
  return {
    bag,
    roles: [],
    permissions: [],
    gateDb: {} as unknown as GatedDb<SchemaTables>,
  };
}

/**
 * The user entity's test stack: its repo plus the profile/contact services it
 * orchestrates (API12 — UserService reaches those entities through services,
 * so a test double must too). Returns the fakes so tests can assert on stored
 * rows directly.
 */
export function makeUserStack(deps: {
  userRepo: InMemoryUserRepository;
  userProfileRepo?: InMemoryUserProfileRepository;
  userContactRepo?: InMemoryUserContactRepository;
}) {
  const userProfileRepo = deps.userProfileRepo ?? new InMemoryUserProfileRepository();
  const userContactRepo = deps.userContactRepo ?? new InMemoryUserContactRepository();
  return {
    userProfileRepo,
    userContactRepo,
    userProfileService: new UserProfileService({
      userProfileRepo,
      engine: testEngine,
      errors: testErrors,
    }),
    userContactService: new UserContactService({
      userContactRepo,
      engine: testEngine,
    }),
    storage: createFakeStorage(),
  };
}
