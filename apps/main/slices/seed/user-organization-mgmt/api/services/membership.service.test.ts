// =============================================================================
// Membership service tests — member listing, role updates, last-owner
// protection, and membership facts. Docker-free.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { PRIVATE } from "@libs/gated-scoped-ac";
import type { OrgLifecycleEntry } from "../../shared/auth-config/types";
import { fixtureAuthConfig } from "../../shared/auth-config/__fixtures__/auth.fixture.config";
import { MembershipService } from "./membership.service";
import {
  InMemoryMembershipRepository,
  InMemoryOrganizationRepository,
  InMemoryUserContactRepository,
  InMemoryUserProfileRepository,
  InMemoryUserRepository,
  testAc,
  testEngine,
  testErrors,
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
        strictEmailMatch: false,
        strictPhoneMatch: false,
      },
      spontaneous: { allow: false },
    },
  },
];

function build() {
  const membershipRepo = new InMemoryMembershipRepository();
  const orgRepo = new InMemoryOrganizationRepository();
  membershipRepo.organizations = orgRepo;
  const userRepo = new InMemoryUserRepository();
  const userProfileRepo = new InMemoryUserProfileRepository();
  const userContactRepo = new InMemoryUserContactRepository();
  membershipRepo.userProfiles = userProfileRepo;
  membershipRepo.userContacts = userContactRepo;
  const service = new MembershipService({
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
  return {
    membershipRepo,
    orgRepo,
    userRepo,
    userProfileRepo,
    userContactRepo,
    service,
  };
}

/** An org with `owner` as owner and any extra members. */
async function seedOrg(
  t: ReturnType<typeof build>,
  members: Array<{ userId: string; roles: string[] }>,
) {
  const org = await t.orgRepo.create(PRIVATE, { type: "company", name: "Acme" });
  for (const m of members) {
    await t.membershipRepo.create(PRIVATE, {
      organizationId: org.id,
      userId: m.userId,
      roles: m.roles,
    });
  }
  return org;
}

describe("member management", () => {
  let t: ReturnType<typeof build>;
  beforeEach(() => {
    t = build();
  });

  it("lists members with their roles, paginated", async () => {
    const org = await seedOrg(t, [
      { userId: "owner", roles: ["company_owner"] },
      { userId: "member", roles: ["company_standard"] },
    ]);
    await t.userContactRepo.create({
      userId: "member",
      contact: { label: "Primary", type: "email", value: "m@test.dev" },
      isDefault: true,
    });
    const { rows, total } = await t.service.getAllByOrgIds(testAc("owner"), PRIVATE, org.id, {
      page: 1,
      pageSize: 20,
    });
    expect(total).toBe(2);
    expect(rows.map((m) => m.userId).sort()).toEqual(["member", "owner"]);
    // the default contact rides the row; a user without one shows null
    expect(rows.find((m) => m.userId === "member")?.contact?.value).toBe(
      "m@test.dev",
    );
    expect(rows.find((m) => m.userId === "owner")?.contact).toBeNull();

    const paged = await t.service.getAllByOrgIds(testAc("owner"), PRIVATE, org.id, {
      page: 2,
      pageSize: 1,
    });
    expect(paged.total).toBe(2);
    expect(paged.rows).toHaveLength(1);
  });

  it("updates a member's roles", async () => {
    const org = await seedOrg(t, [
      { userId: "owner", roles: ["company_owner"] },
      { userId: "member", roles: ["company_standard"] },
    ]);
    await t.service.updateRoles(testAc("owner"), PRIVATE, org.id, "member", ["company_manager"]);
    const member = await t.membershipRepo.findByOrgIdAndUserId(PRIVATE, org.id, "member");
    expect(member?.roles).toEqual(["company_manager"]);
  });

  it("blocks stripping the owner role from the sole owner", async () => {
    const org = await seedOrg(t, [
      { userId: "owner", roles: ["company_owner"] },
    ]);
    await expect(
      t.service.updateRoles(testAc("owner"), PRIVATE, org.id, "owner", ["company_standard"]),
    ).rejects.toThrow(/at least one owner/);
  });

  it("allows demoting an owner when another owner remains", async () => {
    const org = await seedOrg(t, [
      { userId: "owner", roles: ["company_owner"] },
      { userId: "owner2", roles: ["company_owner"] },
    ]);
    await t.service.updateRoles(testAc("owner"), PRIVATE, org.id, "owner2", [
      "company_standard",
    ]);
    const member = await t.membershipRepo.findByOrgIdAndUserId(PRIVATE, org.id, "owner2");
    expect(member?.roles).toEqual(["company_standard"]);
  });

  it("blocks removing the last owner", async () => {
    const org = await seedOrg(t, [
      { userId: "owner", roles: ["company_owner"] },
    ]);
    await expect(t.service.remove(testAc("owner"), PRIVATE, org.id, "owner")).rejects.toThrow(
      /at least one owner/,
    );
  });

  it("removes a non-owner member", async () => {
    const org = await seedOrg(t, [
      { userId: "owner", roles: ["company_owner"] },
      { userId: "member", roles: ["company_standard"] },
    ]);
    await t.service.remove(testAc("owner"), PRIVATE, org.id, "member");
    expect(
      await t.membershipRepo.findByOrgIdAndUserId(PRIVATE, org.id, "member"),
    ).toBeNull();
  });

  it("a removed member no longer appears in the org's list", async () => {
    const org = await seedOrg(t, [
      { userId: "owner", roles: ["company_owner"] },
      { userId: "member", roles: ["company_standard"] },
    ]);
    await t.service.remove(testAc("owner"), PRIVATE, org.id, "member");
    const { rows, total } = await t.service.getAllByOrgIds(testAc("owner"), PRIVATE, org.id, {
      page: 1,
      pageSize: 20,
    });
    expect(total).toBe(1);
    expect(rows.map((m) => m.userId)).toEqual(["owner"]);
  });

  it("re-adding a removed member creates a fresh live row", async () => {
    const org = await seedOrg(t, [
      { userId: "owner", roles: ["company_owner"] },
      { userId: "member", roles: ["company_standard"] },
    ]);
    const before = await t.membershipRepo.findByOrgIdAndUserId(PRIVATE, org.id, "member");
    await t.service.remove(testAc("owner"), PRIVATE, org.id, "member");
    await t.service.addMember(PRIVATE, org.id, "member", ["company_manager"]);
    const after = await t.membershipRepo.findByOrgIdAndUserId(PRIVATE, org.id, "member");
    expect(after).not.toBeNull();
    expect(after?.id).not.toBe(before?.id); // fresh row, not the revived one
    expect(after?.roles).toEqual(["company_manager"]);
  });
});

describe("membership facts", () => {
  it("maps one membership row to one facts entry", async () => {
    const t = build();
    await seedOrg(t, [{ userId: "u1", roles: ["company_owner"] }]);
    const facts = await t.service.getMembershipFactsByUserId("u1");
    expect(facts).toEqual([
      {
        organizationId: expect.any(String),
        orgType: "company",
        roles: ["company_owner"],
      },
    ]);
  });
});

describe("getAllMembershipsByUserId", () => {
  it("returns the caller's memberships joined to their org views", async () => {
    const t = build();
    const org = await seedOrg(t, [{ userId: "u1", roles: ["company_owner"] }]);
    const memberships = await t.service.getAllMembershipsByUserId(PRIVATE, "u1");
    expect(memberships).toHaveLength(1);
    expect(memberships[0]).toMatchObject({
      organization: { id: org.id, name: "Acme", type: "company" },
      roles: ["company_owner"],
    });
  });
});

