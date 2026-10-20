// =============================================================================
// Gate service tests — standing obligations, against the fixture config.
//
// Two families, tested separately because they carry different filters:
//   · membership contexts (system_admin demands verified email + password +
//     totp + name; company demands consent + profile) — unfiltered.
//   · registration invariants — what an account must carry no matter how it
//     left the registration flow: PERSISTENT outcomes only, and only for the
//     identifier types the caller OWNS.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { PRIVATE } from "@libs/gated-scoped-ac";
import { fixtureAuthConfig } from "../../shared/auth-config/__fixtures__/auth.fixture.config";
import { GateService } from "./gate.service";
import { LegalDocumentService } from "./legal-document.service";
import { ConsentRecordService } from "./consent-record.service";
import { UserService } from "./user.service";
import { FAKE_CODE, FAKE_TOTP, FakeIdentityPort } from "../testing/fake-identity-port";
import {
  InMemoryConsentRecordRepository,
  InMemoryLegalDocumentRepository,
  InMemoryUserProfileRepository,
  InMemoryUserRepository,
  makeUserStack,
  publishTestDoc,
  testEngine,
  testErrors,
  testLogger,
} from "../testing/in-memory-repos";

/** The gate reads profiles through the user service's narrow accessor. */
const userProfileRepo = new InMemoryUserProfileRepository();
function userServiceOver(port: FakeIdentityPort, userRepo: InMemoryUserRepository) {
  return new UserService({
    userRepo,
    ...makeUserStack({ userRepo, userProfileRepo }),
    port,
    hooks: {},
    errors: testErrors,
  });
}

async function subjectWith(
  port: FakeIdentityPort,
  userRepo: InMemoryUserRepository,
) {
  const registered = await port.registerPassword(
    { email: "gate@test.dev" },
    "Str0ng-pass!",
  );
  const user = await userRepo.create({ identityId: registered.identityId });
  return {
    userId: user.id,
    identityId: registered.identityId,
    sessionToken: registered.sessionToken,
    session: registered.session,
  };
}

describe("gate service", () => {
  let port: FakeIdentityPort;
  let userRepo: InMemoryUserRepository;
  let legalDocumentRepo: InMemoryLegalDocumentRepository;
  let consentRecordRepo: InMemoryConsentRecordRepository;
  let gate: GateService;

  beforeEach(() => {
    port = new FakeIdentityPort();
    userRepo = new InMemoryUserRepository();
    userProfileRepo.profiles.clear();
    legalDocumentRepo = new InMemoryLegalDocumentRepository();
    consentRecordRepo = new InMemoryConsentRecordRepository();
    const legalDocumentService = new LegalDocumentService({
      legalDocumentRepo,
      engine: testEngine,
      authConfig: fixtureAuthConfig,
      orgConfig: [],
      errors: testErrors,
      logger: testLogger,
    });
    gate = new GateService({
      authConfig: fixtureAuthConfig,
      orgConfig: [],
      port,
      userService: userServiceOver(port, userRepo),
      legalDocumentService,
      consentRecordService: new ConsentRecordService({
        consentRecordRepo,
        legalDocumentService,
        engine: testEngine,
        errors: testErrors,
      }),
      logger: testLogger,
    });
  });

  it("system_admin member: blocked on unverified email, missing totp, missing name — consent exempt", async () => {
    const s = await subjectWith(port, userRepo);
    const result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: [{ organizationId: "org-1", orgType: "system_admin", roles: [] }],
    });
    expect(result.status).toBe("blocked");
    const unmet = result.status === "blocked" ? result.obligations : [];
    expect(unmet.flatMap((o) => o.identityTypes ?? [])).toContain("email"); // unverified
    expect(unmet.map((o) => o.factorMethod)).toContain("totp"); // no aal2
    expect(unmet.map((o) => o.dataField)).toContain("name");
    // the notWhen carve-out survives the registration re-check: the caller's org
    // type is folded into that context too, so break-glass admins stay exempt
    expect(unmet.filter((o) => o.consent)).toHaveLength(0);
    // password was proven by this session — not among the unmet
    expect(unmet.map((o) => o.factorMethod)).not.toContain("password");
  });

  it("an obligation matched through both lenses is reported once", async () => {
    // The fixture's name rule fires in the membership context AND in the
    // registration re-check (which folds org types in) — the caller must
    // still see ONE "provide your name", not one per scope.
    const s = await subjectWith(port, userRepo);
    const result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: [
        { organizationId: "org-1", orgType: "system_admin", roles: [] },
      ],
    });
    expect(result.status).toBe("blocked");
    const unmet = result.status === "blocked" ? result.obligations : [];
    expect(unmet.filter((o) => o.dataField === "name")).toHaveLength(1);
  });

  it("phone-only system_admin owes a usable identifier — the identifiers-map invariant", async () => {
    // the fixture excludes phone for system_admin members; holding one is
    // fine, holding ONLY one is not — the gate demands any usable type back
    const started = await port.startCodeRegistration({ phone: "+351933333333" });
    const registered = await port.submitCodeRegistration(
      started.flowId,
      { phone: "+351933333333" },
      FAKE_CODE,
    );
    const user = await userRepo.create({ identityId: registered.identityId });

    const result = await gate.evaluate(PRIVATE, {
      userId: user.id,
      identityId: registered.identityId,
      session: registered.session,
      memberships: [
        { organizationId: "org-1", orgType: "system_admin", roles: [] },
      ],
    });
    expect(result.status).toBe("blocked");
    const unmet = result.status === "blocked" ? result.obligations : [];
    const invariant = unmet.find(
      (o) => o.require === "identifier_present" && o.identityTypes,
    );
    expect(invariant?.identityTypes).toEqual(["email"]);
  });

  it("clears system_admin once email is verified, totp proven, name provided", async () => {
    const s = await subjectWith(port, userRepo);
    // verify the email
    const started = await port.startVerification("gate@test.dev", "email");
    await port.submitVerification(started.flowId, FAKE_CODE, {
      value: "gate@test.dev",
      via: "email",
    });
    // enroll + prove totp on this session
    const enrollment = await port.startTotpEnrollment(s.sessionToken);
    await port.confirmTotpEnrollment(
      s.sessionToken,
      enrollment.flowId,
      FAKE_TOTP,
    );
    const upgraded = await port.stepUpTotp(s.sessionToken, FAKE_TOTP);
    // provide the name
    await userProfileRepo.update(s.userId, { name: "Gate Admin" });

    const result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: upgraded,
      memberships: [{ organizationId: "org-1", orgType: "system_admin", roles: [] }],
    });
    expect(result).toEqual({ status: "clear" });
  });

  it("step-up role demands totp even without org-type rules", async () => {
    const s = await subjectWith(port, userRepo);
    await userProfileRepo.update(s.userId, { name: "Ana", data: { age: 30 } });
    const result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: [{ organizationId: "org-1", orgType: "company", roles: ["manage_system_admin"] }],
    });
    expect(result.status).toBe("blocked");
    const unmet = result.status === "blocked" ? result.obligations : [];
    expect(unmet.map((o) => o.factorMethod)).toContain("totp");
  });

  it("legal consent is the first obligation — before identifiers, factors and profile data", async () => {
    // Nothing settled: the email is unverified, no profile data, the company's
    // terms are published. The caller agrees to the terms before anything
    // else is asked of them; the rest still stands, after it.
    const s = await subjectWith(port, userRepo);
    await publishTestDoc(legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: "company",
      title: "T",
      contentHtml: "<p>t</p>",
    });
    const result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: [{ organizationId: "org-1", orgType: "company", roles: [] }],
    });
    expect(result.status).toBe("blocked");
    const unmet = result.status === "blocked" ? result.obligations : [];
    expect(unmet[0]?.require).toBe("legal_consent_granted");
    expect(unmet.slice(1).map((o) => o.require)).toContain("profile_data_provided");
    expect(unmet.slice(1).map((o) => o.require)).toContain("identifier_verified");
  });

  it("company member: consent blocks until granted at the CURRENT version", async () => {
    const s = await subjectWith(port, userRepo);
    await userProfileRepo.update(s.userId, {
      name: "Ana",
      data: { age: 30 },
    });
    // the registration invariant owns the email — verify it so consent is the
    // only thing left moving in this test
    const started = await port.startVerification("gate@test.dev", "email");
    await port.submitVerification(started.flowId, FAKE_CODE, {
      value: "gate@test.dev",
      via: "email",
    });
    const legalService = new ConsentRecordService({
      consentRecordRepo,
      legalDocumentService: new LegalDocumentService({
        legalDocumentRepo,
        engine: testEngine,
        authConfig: fixtureAuthConfig,
        orgConfig: [],
        errors: testErrors,
        logger: testLogger,
      }),
      engine: testEngine,
      errors: testErrors,
    });
    const membership = [{ organizationId: "org-1", orgType: "company", roles: [] }];
    // no published docs → consent waived → clear
    let result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: membership,
    });
    expect(result.status).toBe("clear");

    // publish docs (company-scoped) → consent now unmet
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
    result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: membership,
    });
    expect(result.status).toBe("blocked");

    // grant consent → clear
    const consentItems = [
      { type: "termsAndConditions" as const, shown: true as const, consent: true as const, mandatory: true },
      { type: "privacyPolicy" as const, shown: true as const, consent: true as const, mandatory: true },
    ];
    await legalService.recordConsent({
      userId: s.userId,
      items: consentItems,
      decisions: [
        { type: "termsAndConditions", accepted: true },
        { type: "privacyPolicy", accepted: true },
      ],
      orgTypeId: "company",
      context: "gate",
    });
    result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: membership,
    });
    expect(result.status).toBe("clear");

    // a re-published version makes the old consent stale → blocked again
    await publishTestDoc(legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: "company",
      title: "T2",
      contentHtml: "<p>t2</p>",
    });
    result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: membership,
    });
    expect(result.status).toBe("blocked");
  });

  it("pendingConsents groups unmet consent by scope, drops waived items", async () => {
    const s = await subjectWith(port, userRepo);
    const membership = [
      { organizationId: "org-1", orgType: "company", roles: [] },
    ];
    // platform T&C (registration invariant) + company T&C (membership rule);
    // privacyPolicy stays unpublished in both scopes → waived, never listed
    await publishTestDoc(legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "Platform T&C",
      contentHtml: "<p>t</p>",
    });
    await publishTestDoc(legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: "company",
      title: "Company T&C",
      contentHtml: "<p>t</p>",
    });

    // a member owes BOTH scopes: the platform doc via the registration
    // invariant, the org-typed doc via the membership rule
    const pending = await gate.pendingConsents(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: membership,
    });
    expect(pending).toHaveLength(2);
    const platform = pending.find((g) => g.orgTypeId === null);
    const company = pending.find((g) => g.orgTypeId === "company");
    expect(platform?.label).toBe("Platform");
    expect(platform?.items).toEqual([
      {
        type: "termsAndConditions",
        consent: true,
        mandatory: true,
        document: expect.objectContaining({ title: "Platform T&C", version: 1 }),
      },
    ]);
    expect(company?.items.map((i) => i.type)).toEqual(["termsAndConditions"]);
  });

  it("a republished PLATFORM document re-gates org members", async () => {
    const s = await subjectWith(port, userRepo);
    await userProfileRepo.update(s.userId, { name: "Ana", data: { age: 30 } });
    const started = await port.startVerification("gate@test.dev", "email");
    await port.submitVerification(started.flowId, FAKE_CODE, {
      value: "gate@test.dev",
      via: "email",
    });
    const membership = [
      { organizationId: "org-1", orgType: "company", roles: [] },
    ];
    const legalService = new ConsentRecordService({
      consentRecordRepo,
      legalDocumentService: new LegalDocumentService({
        legalDocumentRepo,
        engine: testEngine,
        authConfig: fixtureAuthConfig,
        orgConfig: [],
        errors: testErrors,
        logger: testLogger,
      }),
      engine: testEngine,
      errors: testErrors,
    });
    const subject = {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: membership,
    };

    await publishTestDoc(legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "Platform T&C",
      contentHtml: "<p>t</p>",
    });
    await legalService.recordConsent({
      userId: s.userId,
      items: [
        { type: "termsAndConditions", shown: true, consent: true, mandatory: true },
      ],
      decisions: [{ type: "termsAndConditions", accepted: true }],
      orgTypeId: null,
      context: "registration",
    });
    expect((await gate.evaluate(PRIVATE, subject)).status).toBe("clear");

    // v2 of the PLATFORM doc → the member is re-gated on their next request
    await publishTestDoc(legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "Platform T&C v2",
      contentHtml: "<p>t2</p>",
    });
    expect((await gate.evaluate(PRIVATE, subject)).status).toBe("blocked");
    const pending = await gate.pendingConsents(PRIVATE, subject);
    expect(pending.map((g) => g.orgTypeId)).toEqual([null]);
  });

  it("pendingConsents is empty for a satisfied caller", async () => {
    const s = await subjectWith(port, userRepo);
    const membership = [
      { organizationId: "org-1", orgType: "company", roles: [] },
    ];
    await publishTestDoc(legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: "company",
      title: "T",
      contentHtml: "<p>t</p>",
    });
    const legalService = new ConsentRecordService({
      consentRecordRepo,
      legalDocumentService: new LegalDocumentService({
        legalDocumentRepo,
        engine: testEngine,
        authConfig: fixtureAuthConfig,
        orgConfig: [],
        errors: testErrors,
        logger: testLogger,
      }),
      engine: testEngine,
      errors: testErrors,
    });
    await legalService.recordConsent({
      userId: s.userId,
      items: [
        { type: "termsAndConditions", shown: true, consent: true, mandatory: true },
      ],
      decisions: [{ type: "termsAndConditions", accepted: true }],
      orgTypeId: "company",
      context: "gate",
    });
    const pending = await gate.pendingConsents(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: membership,
    });
    expect(pending.filter((g) => g.orgTypeId === "company")).toEqual([]);
  });

  it("pendingConsents honors the system_admin carve-out", async () => {
    const s = await subjectWith(port, userRepo);
    await publishTestDoc(legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>t</p>",
    });
    const pending = await gate.pendingConsents(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: [
        { organizationId: "org-1", orgType: "system_admin", roles: [] },
      ],
    });
    expect(pending).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Registration invariants — the account-shaped half of the gate. A caller with
// no memberships is NOT structurally clear: what registration was supposed to
// establish still has to hold, or a refresh mid-flow would strand them.
// ─────────────────────────────────────────────────────────────────────────────

describe("gate service — registration invariants", () => {
  let port: FakeIdentityPort;
  let userRepo: InMemoryUserRepository;
  let legalDocumentRepo: InMemoryLegalDocumentRepository;
  let consentRecordRepo: InMemoryConsentRecordRepository;
  let gate: GateService;

  beforeEach(() => {
    port = new FakeIdentityPort();
    userRepo = new InMemoryUserRepository();
    userProfileRepo.profiles.clear();
    legalDocumentRepo = new InMemoryLegalDocumentRepository();
    consentRecordRepo = new InMemoryConsentRecordRepository();
    const legalDocumentService = new LegalDocumentService({
      legalDocumentRepo,
      engine: testEngine,
      authConfig: fixtureAuthConfig,
      orgConfig: [],
      errors: testErrors,
      logger: testLogger,
    });
    gate = new GateService({
      authConfig: fixtureAuthConfig,
      orgConfig: [],
      port,
      userService: userServiceOver(port, userRepo),
      legalDocumentService,
      consentRecordService: new ConsentRecordService({
        consentRecordRepo,
        legalDocumentService,
        engine: testEngine,
        errors: testErrors,
      }),
      logger: testLogger,
    });
  });

  it("catches the registrant who walked away before verifying — no membership needed", async () => {
    const s = await subjectWith(port, userRepo); // email registered, unverified
    const result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: [],
    });
    expect(result.status).toBe("blocked");
    const unmet = result.status === "blocked" ? result.obligations : [];
    expect(unmet.flatMap((o) => o.identityTypes ?? [])).toContain("email");
    expect(unmet.map((o) => o.dataField)).toContain("name");
  });

  it("clears once the account carries what registration asked for", async () => {
    const s = await subjectWith(port, userRepo);
    const started = await port.startVerification("gate@test.dev", "email");
    await port.submitVerification(started.flowId, FAKE_CODE, {
      value: "gate@test.dev",
      via: "email",
    });
    await userProfileRepo.update(s.userId, { name: "Ana" });

    const result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: [],
    });
    expect(result).toEqual({ status: "clear" });
  });

  it("a phone-only account is never asked to verify an email it does not own", async () => {
    // registering by code pre-verifies the phone — nothing left to prove
    const started = await port.startCodeRegistration({ phone: "+351911111111" });
    const registered = await port.submitCodeRegistration(
      started.flowId,
      { phone: "+351911111111" },
      FAKE_CODE,
    );
    const user = await userRepo.create({ identityId: registered.identityId });
    await userProfileRepo.update(user.id, { name: "Zé" });

    const result = await gate.evaluate(PRIVATE, {
      userId: user.id,
      identityId: registered.identityId,
      session: registered.session,
      memberships: [],
    });
    expect(result).toEqual({ status: "clear" });
  });

  it("does not pin the session to registration's factor — a code login is not gated on password", async () => {
    // the fixture's email password rule is intent-keyed {registration,
    // authentication}: a SESSION-layer fact, so it must not stand at the gate.
    const s = await subjectWith(port, userRepo);
    const started = await port.startVerification("gate@test.dev", "email");
    await port.submitVerification(started.flowId, FAKE_CODE, {
      value: "gate@test.dev",
      via: "email",
    });
    await userProfileRepo.update(s.userId, { name: "Ana" });

    // sign in again with a CODE — no password on this session
    const login = await port.startCodeLogin("gate@test.dev");
    const codeSession = await port.submitCodeLogin(
      login.flowId,
      "gate@test.dev",
      FAKE_CODE,
    );
    expect(codeSession.session.methods.map((m) => m.method)).not.toContain(
      "password",
    );

    const result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: codeSession.session,
      memberships: [],
    });
    expect(result).toEqual({ status: "clear" });
  });

  it("a second, unverified email does not gate an account whose first is verified", async () => {
    const s = await subjectWith(port, userRepo);
    const started = await port.startVerification("gate@test.dev", "email");
    await port.submitVerification(started.flowId, FAKE_CODE, {
      value: "gate@test.dev",
      via: "email",
    });
    await userProfileRepo.update(s.userId, { name: "Ana" });
    // adds a spare address and never proves it — the verified one still answers
    await port.addIdentifier(s.identityId, {
      type: "email",
      value: "spare@test.dev",
    });

    const result = await gate.evaluate(PRIVATE, {
      userId: s.userId,
      identityId: s.identityId,
      session: s.session,
      memberships: [],
    });
    expect(result).toEqual({ status: "clear" });
  });
});
