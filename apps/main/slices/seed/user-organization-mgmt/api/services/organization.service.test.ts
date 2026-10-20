// =============================================================================
// Organization service tests — creation gating (actor, singleton, consent),
// owner seating, and membership listing. Docker-free.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { PRIVATE } from "@libs/gated-scoped-ac";
import type { OrgLifecycleEntry } from "../../shared/auth-config/types";
import { fixtureAuthConfig } from "../../shared/auth-config/__fixtures__/auth.fixture.config";
import { OrganizationService } from "./organization.service";
import { createFakeStorage } from "../testing/fake-storage";
import { MembershipService } from "./membership.service";
import { LegalDocumentService } from "./legal-document.service";
import { ConsentRecordService } from "./consent-record.service";
import {
  InMemoryConsentRecordRepository,
  InMemoryLegalDocumentRepository,
  InMemoryMembershipRepository,
  InMemoryOrganizationRepository,
  InMemoryUserRepository,
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
      ownership: {
        mode: ["creator"],
        membershipOwnerRole: "company_owner",
        legalConsent: [
          { type: "termsAndConditions", shown: true, consent: true },
          { type: "privacyPolicy", shown: true, consent: true },
        ],
      },
    },
    join: {
      invitation: {
        allow: true,
        confirmation: "explicit",
        strictEmailMatch: false,
        strictPhoneMatch: false,
      },
      spontaneous: { allow: false },
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
  },
  {
    orgType: "system_admin",
    label: "System Admin",
    isSingleInstance: true,
    creation: { actor: "developer" },
  },
];

function build() {
  const orgRepo = new InMemoryOrganizationRepository();
  const membershipRepo = new InMemoryMembershipRepository();
  membershipRepo.organizations = orgRepo;
  const userRepo = new InMemoryUserRepository();
  const legalDocumentRepo = new InMemoryLegalDocumentRepository();
  const consentRecordRepo = new InMemoryConsentRecordRepository();
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
  const membershipService = new MembershipService({
    membershipRepo,
    organizationService: () => ({
      getOrg: async (visibility, orgId: string) =>
        (await orgRepo.findByIds(visibility, [orgId]))[0] ?? null,
    }),
    engine: testEngine,
    orgConfig: ORG_CONFIG,
    authConfig: fixtureAuthConfig,
    errors: testErrors,
  });
  const service = new OrganizationService({
    orgRepo,
    membershipService,
    consentRecordService,
    engine: testEngine,
    storage: createFakeStorage(),
    orgConfig: ORG_CONFIG,
    authConfig: fixtureAuthConfig,
    errors: testErrors,
    logger: testLogger,
  });
  return {
    orgRepo,
    membershipRepo,
    userRepo,
    legalDocumentRepo,
    consentRecordRepo,
    service,
  };
}

async function publishCompanyDocs(legalDocumentRepo: InMemoryLegalDocumentRepository) {
  await publishTestDoc(legalDocumentRepo, {
    type: "termsAndConditions",
    orgTypeId: "company",
    title: "T",
    contentHtml: "<p>t</p>",
  });
  await publishTestDoc(legalDocumentRepo, {
    type: "privacyPolicy",
    orgTypeId: "company",
    title: "P",
    contentHtml: "<p>p</p>",
  });
}

describe("organization creation", () => {
  let t: ReturnType<typeof build>;
  beforeEach(() => {
    t = build();
  });

  it("seats the creator as owner and records creation consent", async () => {
    await publishCompanyDocs(t.legalDocumentRepo);
    const org = await t.service.create(testAc("user_1"), PRIVATE, {
      type: "company",
      name: "Acme",
      consents: [
        { type: "termsAndConditions", accepted: true },
        { type: "privacyPolicy", accepted: true },
      ],
    });
    expect(org.typeLabel).toBe("Company");

    const member = await t.membershipRepo.findByOrgIdAndUserId(PRIVATE, org.id, "user_1");
    expect(member?.roles).toEqual(["company_owner"]);
    const consents = await t.consentRecordRepo.findAllByUserIds(["user_1"]);
    expect(consents.map((c) => c.orgTypeId)).toEqual(["company", "company"]);
  });

  it("update persists a logo URL and clears it with null", async () => {
    await publishCompanyDocs(t.legalDocumentRepo);
    const org = await t.service.create(testAc("user_1"), PRIVATE, {
      type: "company",
      name: "Acme",
      consents: [
        { type: "termsAndConditions", accepted: true },
        { type: "privacyPolicy", accepted: true },
      ],
    });

    const withLogo = await t.service.update(testAc("user_1"), PRIVATE, org.id, {
      logo: "https://cdn.test.dev/organizations/acme/logo.png",
    });
    expect(withLogo.logo).toBe(
      "https://cdn.test.dev/organizations/acme/logo.png",
    );

    const cleared = await t.service.update(testAc("user_1"), PRIVATE, org.id, { logo: null });
    expect(cleared.logo).toBeNull();
  });

  it("rejects creation without mandatory consent", async () => {
    await publishCompanyDocs(t.legalDocumentRepo);
    await expect(
      t.service.create(testAc("user_1"), PRIVATE, { type: "company", name: "Acme" }),
    ).rejects.toThrow(/consent to/);
  });

  it("forbids user-creation of a developer-actor type", async () => {
    await expect(
      t.service.create(testAc("user_1"), PRIVATE, { type: "system_admin", name: "Sys" }),
    ).rejects.toThrow(/provisioned by the platform/);
  });

  it("enforces singletons — a second instance is rejected", async () => {
    await t.service.create(testAc("user_1"), PRIVATE, { type: "platform_admin", name: "P1" });
    await expect(
      t.service.create(testAc("user_2"), PRIVATE, { type: "platform_admin", name: "P2" }),
    ).rejects.toThrow(/only one/);
  });

  it("rejects an unknown org type", async () => {
    await expect(
      t.service.create(testAc("user_1"), PRIVATE, { type: "ghost", name: "X" }),
    ).rejects.toThrow(/unknown organization type/);
  });
});

describe("creatableTypes", () => {
  it("returns only user-actor types (developer-only excluded)", () => {
    const { service } = build();
    const ids = service.creatableTypes(PRIVATE).map((t) => t.id);
    expect(ids).toEqual(["company", "platform_admin"]);
    expect(ids).not.toContain("system_admin");
  });
});

describe("getAll (directory)", () => {
  it("searches by name, filters by type, paginates, derives status", async () => {
    const t = build();
    await t.orgRepo.create(PRIVATE, { type: "company", name: "Acme" });
    await t.orgRepo.create(PRIVATE, { type: "company", name: "Beta Corp" });
    await t.orgRepo.create(PRIVATE, {
      type: "platform_admin",
      name: "Platform HQ",
      metadata: { status: "inactive" },
    });

    const all = await t.service.getAll(testAc("user_1"), PRIVATE, { page: 1, pageSize: 20 });
    expect(all.total).toBe(3);
    // name-ordered; status derives from metadata (unset ⇒ active)
    expect(all.rows.map((o) => o.name)).toEqual([
      "Acme",
      "Beta Corp",
      "Platform HQ",
    ]);
    expect(all.rows.find((o) => o.name === "Acme")?.status).toBe("active");
    expect(all.rows.find((o) => o.name === "Platform HQ")?.status).toBe(
      "inactive",
    );
    expect(all.rows.find((o) => o.name === "Platform HQ")?.typeLabel).toBe(
      "Platform Admin",
    );

    const searched = await t.service.getAll(testAc("user_1"), PRIVATE, {
      search: "beta",
      page: 1,
      pageSize: 20,
    });
    expect(searched.rows.map((o) => o.name)).toEqual(["Beta Corp"]);

    const typed = await t.service.getAll(testAc("user_1"), PRIVATE, {
      type: "company",
      page: 1,
      pageSize: 20,
    });
    expect(typed.total).toBe(2);

    const paged = await t.service.getAll(testAc("user_1"), PRIVATE, { page: 2, pageSize: 2 });
    expect(paged.total).toBe(3);
    expect(paged.rows).toHaveLength(1);
  });
});
