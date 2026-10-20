// =============================================================================
// Invitation service tests — invite gating, strictness on accept,
// cross-org isolation, and lifecycle transitions. Docker-free.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { PRIVATE, PUBLIC } from "@libs/gated-scoped-ac";
import type {
  AuthAndRegistrationConfig,
  OrgLifecycleEntry,
} from "../../shared/auth-config/types";
import { fixtureAuthConfig } from "../../shared/auth-config/__fixtures__/auth.fixture.config";
import type { InvitationAcceptedPayload } from "../../shared/types/hooks";
import { InvitationService } from "./invitation.service";
import { LegalDocumentService } from "./legal-document.service";
import { ConsentRecordService } from "./consent-record.service";
import { MembershipService } from "./membership.service";
import { UserService } from "./user.service";
import { FakeIdentityPort } from "../testing/fake-identity-port";
import {
  InMemoryInvitationRepository,
  InMemoryConsentRecordRepository,
  InMemoryLegalDocumentRepository,
  InMemoryMembershipRepository,
  InMemoryOrganizationRepository,
  InMemoryUserRepository,
  makeUserStack,
  publishTestDoc,
  testAc,
  testEngine,
  testErrors,
  testLogger,
} from "../testing/in-memory-repos";

const ORG_CONFIG: OrgLifecycleEntry[] = [
  {
    orgType: "company",
    label: "Company",
    isSingleInstance: false,
    creation: {
      actor: "user",
      ownership: { mode: ["creator"], membershipOwnerRole: "company_owner" },
    },
    join: {
      invitation: {
        allow: true,
        confirmation: "explicit",
        strictEmailMatch: false, // any owned email suffices
        strictPhoneMatch: false,
      },
      spontaneous: { allow: false },
      // waived while unpublished — the consent tests publish a doc to arm it
      legalConsent: [
        { type: "termsAndConditions", shown: true, consent: true, mandatory: true },
      ],
    },
  },
  {
    orgType: "platform_admin",
    label: "Platform Admin",
    isSingleInstance: true,
    creation: {
      actor: "user",
      ownership: { mode: ["creator"], membershipOwnerRole: "platform_owner" },
    },
    join: {
      invitation: {
        allow: true,
        confirmation: "explicit",
        strictEmailMatch: true, // must own the exact invited address
        strictPhoneMatch: true,
        expiresInSeconds: 60 * 60, // the expiry test reads this
      },
      spontaneous: { allow: false },
    },
  },
  {
    orgType: "vault",
    label: "Vault",
    isSingleInstance: false,
    creation: {
      actor: "user",
      ownership: { mode: ["creator"], membershipOwnerRole: "vault_owner" },
    },
    // no join block — invitations not allowed
  },
];

// Existing tests don't exercise channel policy, so default to a config where
// every org type accepts email and phone; the block test passes a config that
// restricts it (the fixture makes admin orgs email-only).
const permissiveConfig: AuthAndRegistrationConfig = {
  ...fixtureAuthConfig,
  identifiers: {
    ...fixtureAuthConfig.identifiers,
    email: { condition: {} },
    phone: { condition: {} },
  },
};

function build(authConfig = permissiveConfig) {
  const invitationRepo = new InMemoryInvitationRepository();
  const membershipRepo = new InMemoryMembershipRepository();
  const orgRepo = new InMemoryOrganizationRepository();
  membershipRepo.organizations = orgRepo;
  const userRepo = new InMemoryUserRepository();
  const legalDocumentRepo = new InMemoryLegalDocumentRepository();
  const consentRecordRepo = new InMemoryConsentRecordRepository();
  const port = new FakeIdentityPort();
  const legalDocumentService = new LegalDocumentService({
    legalDocumentRepo,
    engine: testEngine,
    authConfig: fixtureAuthConfig,
    orgConfig: ORG_CONFIG,
    errors: testErrors,
    logger: testLogger,
  });
  const consentRecordService = new ConsentRecordService({
    consentRecordRepo,
    legalDocumentService,
    engine: testEngine,
    errors: testErrors,
  });
  const sent: Array<{ to: string; channel: "email" | "sms" }> = [];
  const accepted: InvitationAcceptedPayload[] = [];
  const userStack = makeUserStack({ userRepo });
  const userService = new UserService({
    userRepo,
    ...userStack,
    port,
    hooks: {},
    errors: testErrors,
  });
  const organizationService = {
    getOrg: async (visibility: typeof PUBLIC, orgId: string) =>
      (await orgRepo.findByIds(visibility, [orgId]))[0] ?? null,
    assertOrg: async (visibility: typeof PUBLIC, orgId: string) => {
      const org = (await orgRepo.findByIds(visibility, [orgId]))[0] ?? null;
      if (!org) throw testErrors.notFound("organization not found");
      return org;
    },
  };
  const membershipService = new MembershipService({
    membershipRepo,
    organizationService: () => organizationService,
    engine: testEngine,
    orgConfig: ORG_CONFIG,
    authConfig: fixtureAuthConfig,
    errors: testErrors,
  });
  const service = new InvitationService({
    invitationRepo,
    membershipService,
    organizationService,
    userService,
    engine: testEngine,
    port,
    legalDocumentService,
    consentRecordService,
    orgConfig: ORG_CONFIG,
    authConfig,
    delivery: {
      sendEmail: (to) => void sent.push({ to, channel: "email" }),
      sendSms: (to) => void sent.push({ to, channel: "sms" }),
    },
    hooks: { onInvitationAccepted: (payload) => void accepted.push(payload) },
    errors: testErrors,
    logger: testLogger,
  });
  return {
    invitationRepo,
    membershipRepo,
    orgRepo,
    userRepo,
    userProfileRepo: userStack.userProfileRepo,
    legalDocumentRepo,
    consentRecordRepo,
    port,
    service,
    sent,
    accepted,
  };
}

/** Register a user via the fake port + user repo, returning {userId, email}. */
async function makeUser(
  t: ReturnType<typeof build>,
  email: string,
): Promise<{ userId: string; email: string }> {
  const reg = await t.port.registerPassword({ email }, "Str0ng-pass!");
  const user = await t.userRepo.create({ identityId: reg.identityId });
  return { userId: user.id, email };
}

async function makeOrg(t: ReturnType<typeof build>, type: string) {
  const org = await t.orgRepo.create(PRIVATE, { type, name: `${type} org` });
  return org;
}

describe("invitation create", () => {
  let t: ReturnType<typeof build>;
  beforeEach(() => {
    t = build();
  });

  it("creates and delivers an email invitation", async () => {
    const owner = await makeUser(t, "owner@test.dev");
    const org = await makeOrg(t, "company");
    await t.membershipRepo.create(PRIVATE, {
      organizationId: org.id,
      userId: owner.userId,
      roles: ["company_owner"],
    });
    const inv = await t.service.create(org.id, testAc(owner.userId), PRIVATE, {
      email: "new@test.dev",
      roles: ["company_standard"],
    });
    expect(inv.status).toBe("pending");
    expect(t.sent).toEqual([{ to: "new@test.dev", channel: "email" }]);
  });

  it("stamps expiresAt from the org type's expiresInSeconds, default 48h", async () => {
    const owner = await makeUser(t, "owner@test.dev");
    const admin = await makeUser(t, "admin@test.dev");
    const company = await makeOrg(t, "company");
    const platform = await makeOrg(t, "platform_admin");
    await t.membershipRepo.create(PRIVATE, {
      organizationId: company.id,
      userId: owner.userId,
      roles: ["company_owner"],
    });
    await t.membershipRepo.create(PRIVATE, {
      organizationId: platform.id,
      userId: admin.userId,
      roles: ["platform_owner"],
    });

    const before = Date.now();
    const configured = await t.service.create(
      platform.id,
      testAc(admin.userId),
      PRIVATE,
      {
        email: "new@test.dev",
        roles: ["platform_standard"],
      },
    );
    const defaulted = await t.service.create(
      company.id,
      testAc(owner.userId),
      PRIVATE,
      {
        email: "new@test.dev",
        roles: ["company_standard"],
      },
    );
    const after = Date.now();

    const hourMs = 60 * 60 * 1000;
    const configuredAt = new Date(configured.expiresAt).getTime();
    expect(configuredAt).toBeGreaterThanOrEqual(before + hourMs);
    expect(configuredAt).toBeLessThanOrEqual(after + hourMs);
    const defaultedAt = new Date(defaulted.expiresAt).getTime();
    expect(defaultedAt).toBeGreaterThanOrEqual(before + 48 * hourMs);
    expect(defaultedAt).toBeLessThanOrEqual(after + 48 * hourMs);
  });

  it("rejects invitations for a type that doesn't allow them", async () => {
    const owner = await makeUser(t, "owner@test.dev");
    const org = await makeOrg(t, "vault");
    await t.membershipRepo.create(PRIVATE, {
      organizationId: org.id,
      userId: owner.userId,
      roles: ["vault_owner"],
    });
    await expect(
      t.service.create(org.id, testAc(owner.userId), PRIVATE, {
        email: "new@test.dev",
        roles: ["x"],
      }),
    ).rejects.toThrow(/don't accept invitations/);
  });

  it("rejects a channel the org type doesn't allow", async () => {
    // The fixture makes admin orgs email-only, so a phone invite is invalid —
    // the invitee could never register with a phone to accept it.
    const t = build(fixtureAuthConfig);
    const owner = await makeUser(t, "owner@test.dev");
    const org = await makeOrg(t, "platform_admin");
    await t.membershipRepo.create(PRIVATE, {
      organizationId: org.id,
      userId: owner.userId,
      roles: ["platform_owner"],
    });
    await expect(
      t.service.create(org.id, testAc(owner.userId), PRIVATE, {
        phone: "+351911111111",
        roles: ["platform_owner"],
      }),
    ).rejects.toThrow(/can't be sent by phone/);
  });
});

describe("invitation accept", () => {
  let t: ReturnType<typeof build>;
  beforeEach(() => {
    t = build();
  });

  async function inviteInto(type: string, invited: string) {
    const owner = await makeUser(t, "owner@test.dev");
    const org = await makeOrg(t, type);
    await t.membershipRepo.create(PRIVATE, {
      organizationId: org.id,
      userId: owner.userId,
      roles: [`${type}_owner`],
    });
    const inv = await t.service.create(org.id, testAc(owner.userId), PRIVATE, {
      email: invited,
      roles: [`${type}_standard`],
    });
    return { org, inv };
  }

  it("lax match — any owned email accepts, membership seated, no auto-verify", async () => {
    const { org, inv } = await inviteInto("company", "invited@test.dev");
    const joiner = await makeUser(t, "invited@test.dev");
    await t.service.accept(PRIVATE, joiner.userId, inv.id);

    const member = await t.membershipRepo.findByOrgIdAndUserId(
      PRIVATE,
      org.id,
      joiner.userId,
    );
    expect(member?.roles).toEqual(["company_standard"]);
    // Accepting never verifies the address — verification stays a code proof.
    const snap = await t.port.getIdentity(
      (await t.userRepo.findByIds(PUBLIC, [joiner.userId]))[0]!.identityId,
    );
    expect(
      snap.addresses.find((a) => a.value === "invited@test.dev")?.verified,
    ).toBe(false);
    expect((await t.invitationRepo.findByIds(PUBLIC, [inv.id]))[0]?.status).toBe("accepted");
  });

  it("announces the acceptance to whoever the app wired", async () => {
    const { org, inv } = await inviteInto("company", "invited@test.dev");
    const joiner = await makeUser(t, "invited@test.dev");
    await t.userProfileRepo.update(joiner.userId, { name: "Ada Lovelace" });
    const owner = (await t.invitationRepo.findByIds(PRIVATE, [inv.id]))[0]!
      .inviterId;

    await t.service.accept(PRIVATE, joiner.userId, inv.id);

    expect(t.accepted).toEqual([
      {
        invitationId: inv.id,
        organizationId: org.id,
        orgName: org.name,
        inviterUserId: owner,
        accepterUserId: joiner.userId,
        accepterName: "Ada Lovelace",
        role: "company_standard",
      },
    ]);
  });

  it("reports a nameless accepter as null rather than inventing a label", async () => {
    const { inv } = await inviteInto("company", "invited@test.dev");
    const joiner = await makeUser(t, "invited@test.dev");

    await t.service.accept(PRIVATE, joiner.userId, inv.id);

    expect(t.accepted[0]?.accepterName).toBeNull();
  });

  it("stays quiet when the acceptance didn't happen", async () => {
    const { inv } = await inviteInto("platform_admin", "exact@test.dev");
    const joiner = await makeUser(t, "different@test.dev");

    await expect(
      t.service.accept(PRIVATE, joiner.userId, inv.id),
    ).rejects.toThrow();

    expect(t.accepted).toEqual([]);
  });

  it("strict match — a different owned email is rejected", async () => {
    const { inv } = await inviteInto("platform_admin", "exact@test.dev");
    const joiner = await makeUser(t, "different@test.dev");
    await expect(t.service.accept(PRIVATE, joiner.userId, inv.id)).rejects.toThrow(
      /different address/,
    );
  });

  it("strict match — the exact owned email accepts", async () => {
    const { org, inv } = await inviteInto("platform_admin", "exact@test.dev");
    const joiner = await makeUser(t, "exact@test.dev");
    await t.service.accept(PRIVATE, joiner.userId, inv.id);
    expect(
      await t.membershipRepo.findByOrgIdAndUserId(
      PRIVATE,
      org.id,
      joiner.userId,
    ),
    ).not.toBeNull();
  });

  it("cross-org isolation — user B cannot accept user A's strict invitation", async () => {
    const { inv } = await inviteInto("platform_admin", "alice@test.dev");
    const bob = await makeUser(t, "bob@test.dev");
    await expect(t.service.accept(PRIVATE, bob.userId, inv.id)).rejects.toThrow(
      /different address/,
    );
  });

  it("rejects an already-accepted invitation", async () => {
    const { inv } = await inviteInto("company", "invited@test.dev");
    const joiner = await makeUser(t, "invited@test.dev");
    await t.service.accept(PRIVATE, joiner.userId, inv.id);
    await expect(t.service.accept(PRIVATE, joiner.userId, inv.id)).rejects.toThrow(
      /no longer pending/,
    );
  });

  it("published join consent — accept without decisions is a 400, nothing seated", async () => {
    const { org, inv } = await inviteInto("company", "invited@test.dev");
    await publishTestDoc(t.legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: "company",
      title: "Company T&C",
      contentHtml: "<p>t</p>",
    });
    const joiner = await makeUser(t, "invited@test.dev");
    await expect(t.service.accept(PRIVATE, joiner.userId, inv.id)).rejects.toThrow(
      /termsAndConditions/,
    );
    expect(
      await t.membershipRepo.findByOrgIdAndUserId(
      PRIVATE,
      org.id,
      joiner.userId,
    ),
    ).toBeNull();
    expect((await t.invitationRepo.findByIds(PUBLIC, [inv.id]))[0]?.status).toBe("pending");
  });

  it("published join consent — accept with decisions seats and records at the org type", async () => {
    const { org, inv } = await inviteInto("company", "invited@test.dev");
    const doc = await publishTestDoc(t.legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: "company",
      title: "Company T&C",
      contentHtml: "<p>t</p>",
    });
    const joiner = await makeUser(t, "invited@test.dev");
    await t.service.accept(PRIVATE, joiner.userId, inv.id, [
      { type: "termsAndConditions", accepted: true },
    ]);
    expect(
      await t.membershipRepo.findByOrgIdAndUserId(
      PRIVATE,
      org.id,
      joiner.userId,
    ),
    ).not.toBeNull();
    const records = await t.consentRecordRepo.findAllByUserIds([joiner.userId]);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      legalDocumentId: doc.id,
      orgTypeId: "company",
      context: "gate",
    });
  });

  it("unpublished join consent — accept proceeds, consent waived", async () => {
    const { org, inv } = await inviteInto("company", "invited@test.dev");
    const joiner = await makeUser(t, "invited@test.dev");
    await t.service.accept(PRIVATE, joiner.userId, inv.id);
    expect(
      await t.membershipRepo.findByOrgIdAndUserId(
      PRIVATE,
      org.id,
      joiner.userId,
    ),
    ).not.toBeNull();
    expect(await t.consentRecordRepo.findAllByUserIds([joiner.userId])).toEqual([]);
  });
});

describe("invitation revoke + pending list", () => {
  it("revokes a pending invitation", async () => {
    const t = build();
    const owner = await makeUser(t, "owner@test.dev");
    const org = await makeOrg(t, "company");
    await t.membershipRepo.create(PRIVATE, {
      organizationId: org.id,
      userId: owner.userId,
      roles: ["company_owner"],
    });
    const inv = await t.service.create(org.id, testAc(owner.userId), PRIVATE, {
      email: "new@test.dev",
      roles: ["company_standard"],
    });
    await t.service.revoke(testAc(owner.userId), PRIVATE, org.id, inv.id);
    expect((await t.invitationRepo.findByIds(PUBLIC, [inv.id]))[0]?.status).toBe("revoked");
  });

  it("lists a user's pending invitations by their identifiers", async () => {
    const t = build();
    const owner = await makeUser(t, "owner@test.dev");
    const org = await makeOrg(t, "company");
    await t.membershipRepo.create(PRIVATE, {
      organizationId: org.id,
      userId: owner.userId,
      roles: ["company_owner"],
    });
    await t.service.create(org.id, testAc(owner.userId), PRIVATE, {
      email: "joiner@test.dev",
      roles: ["company_standard"],
    });
    const joiner = await makeUser(t, "joiner@test.dev");
    const pending = await t.service.getInvitationsByUserId(PRIVATE, joiner.userId);
    expect(pending).toHaveLength(1);
    expect(pending[0].email).toBe("joiner@test.dev");
    // the inviting org rides each row; no published join document → accept inline
    expect(pending[0].organization).toMatchObject({
      id: org.id,
      name: "company org",
      type: "company",
      typeLabel: "Company",
    });
    expect(pending[0].requiresConsent).toBe(false);
  });

  it("flags an invitation whose org type's join consent has a published document", async () => {
    const t = build();
    const owner = await makeUser(t, "owner@test.dev");
    const org = await makeOrg(t, "company");
    await t.membershipRepo.create(PRIVATE, {
      organizationId: org.id,
      userId: owner.userId,
      roles: ["company_owner"],
    });
    await t.service.create(org.id, testAc(owner.userId), PRIVATE, {
      email: "joiner@test.dev",
      roles: ["company_standard"],
    });
    await publishTestDoc(t.legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: "company",
      title: "Company T&C",
      contentHtml: "<p>t</p>",
    });
    const joiner = await makeUser(t, "joiner@test.dev");
    const pending = await t.service.getInvitationsByUserId(PRIVATE, joiner.userId);
    expect(pending[0].requiresConsent).toBe(true);
  });
});

describe("public view", () => {
  it("exposes the invited identifier and org type", async () => {
    const t = build();
    const owner = await makeUser(t, "owner@test.dev");
    const org = await makeOrg(t, "company");
    await t.membershipRepo.create(PRIVATE, {
      organizationId: org.id,
      userId: owner.userId,
      roles: ["company_owner"],
    });
    const inv = await t.service.create(org.id, testAc(owner.userId), PRIVATE, {
      email: "secret@example.com",
      roles: ["company_standard"],
    });
    const view = await t.service.getPublicView(PUBLIC, inv.id);
    expect(view.organizationName).toBe("company org");
    expect(view.orgType).toBe("company");
    expect(view.identifier).toBe("secret@example.com");
  });

  it("pairs the org type's join consent with its current documents", async () => {
    const t = build();
    const owner = await makeUser(t, "owner@test.dev");
    const org = await makeOrg(t, "company");
    await t.membershipRepo.create(PRIVATE, {
      organizationId: org.id,
      userId: owner.userId,
      roles: ["company_owner"],
    });
    const inv = await t.service.create(org.id, testAc(owner.userId), PRIVATE, {
      email: "new@test.dev",
      roles: ["company_standard"],
    });

    // unpublished → item listed with document: null (the page won't demand it)
    let view = await t.service.getPublicView(PUBLIC, inv.id);
    expect(view.joinConsent).toEqual([
      {
        type: "termsAndConditions",
        consent: true,
        mandatory: true,
        document: null,
      },
    ]);

    await publishTestDoc(t.legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: "company",
      title: "Company T&C",
      contentHtml: "<p>t</p>",
    });
    view = await t.service.getPublicView(PUBLIC, inv.id);
    expect(view.joinConsent[0].document).toMatchObject({
      title: "Company T&C",
      version: 1,
    });
  });
});
