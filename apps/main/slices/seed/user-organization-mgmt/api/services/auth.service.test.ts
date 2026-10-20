// =============================================================================
// Auth tests — against the in-memory identity double and the fixture
// config (email collects a password, set at birth; phone is password-free;
// email OTP is a LOGIN-only alternative).
//
// The properties under test are the ones the design rests on:
//   · EVERY registration is a code registration: nothing exists until the
//     code is proven, and the identity is born with its address verified
//   · the verify request is the atomic carrier — code, name, consents, and
//     password together; the gauntlet re-runs BEFORE birth
//   · after birth, side-write failures degrade (passwordless account, gate
//     collects consent) but never cost the person the account
//   · nothing leaks account existence — the starts are indistinguishable
//   · login-time 2FA does NOT exist: TOTP is the gate's demand, so a
//     credential proof always signs in (at AAL1; the gate blocks from there)
// Docker-free.
// =============================================================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PUBLIC } from "@libs/gated-scoped-ac";
import { fixtureAuthConfig } from "../../shared/auth-config/__fixtures__/auth.fixture.config";
import { AuthService, type RegistrationInput } from "./auth.service";
import { LegalDocumentService } from "./legal-document.service";
import { ConsentRecordService } from "./consent-record.service";
import {
  FAKE_CODE,
  FAKE_TOTP,
  FakeIdentityPort,
} from "../testing/fake-identity-port";
import { IdentityProviderError } from "../identity/identity-provider.port";
import { UserService } from "./user.service";
import {
  InMemoryConsentRecordRepository,
  InMemoryLegalDocumentRepository,
  InMemoryUserRepository,
  makeUserStack,
  publishTestDoc,
  testEngine,
  testErrors,
  testLogger,
} from "../testing/in-memory-repos";

function build(overrides?: { authConfig?: typeof fixtureAuthConfig }) {
  const port = new FakeIdentityPort();
  const userRepo = new InMemoryUserRepository();
  const userStack = makeUserStack({ userRepo });
  const { userProfileRepo } = userStack;
  const legalDocumentRepo = new InMemoryLegalDocumentRepository();
  const consentRecordRepo = new InMemoryConsentRecordRepository();
  const legalDocumentService = new LegalDocumentService({
    legalDocumentRepo,
    engine: testEngine,
    authConfig: fixtureAuthConfig,
    orgConfig: [],
    errors: testErrors,
    logger: testLogger,
  });
  const registered: string[] = [];
  const authService = new AuthService({
    authConfig: overrides?.authConfig ?? fixtureAuthConfig,
    port,
    userService: new UserService({
      userRepo,
      ...userStack,
      port,
      hooks: {},
      errors: testErrors,
    }),
    consentRecordService: new ConsentRecordService({
      consentRecordRepo,
      legalDocumentService,
      engine: testEngine,
      errors: testErrors,
    }),
    hooks: { onUserRegistered: ({ userId }) => void registered.push(userId) },
    errors: testErrors,
    logger: testLogger,
    socialProviders: { google: false, apple: false },
  });
  return {
    port,
    userRepo,
    userProfileRepo,
    legalDocumentRepo,
    consentRecordRepo,
    authService,
    registered,
  };
}

const EMAIL = { type: "email" as const, value: "ana@test.dev" };
const PHONE = { type: "phone" as const, value: "+351911111111" };
const PASSWORD = "Str0ng-pass!";

/** The one shape every account takes: form → code → born. */
async function registerUser(
  t: ReturnType<typeof build>,
  identifier: RegistrationInput["identifier"],
  opts: Omit<RegistrationInput, "identifier"> = {},
) {
  const { flowId } = await t.authService.register(PUBLIC, { identifier, ...opts });
  return t.authService.registerVerify(PUBLIC, {
    flowId,
    identifier,
    code: FAKE_CODE,
    ...opts,
  });
}

describe("auth — registration", () => {
  let t: ReturnType<typeof build>;
  beforeEach(() => {
    t = build();
  });

  it("email: nothing exists until the code is proven — then born verified, signed in, password set", async () => {
    const started = await t.authService.register(PUBLIC, {
      identifier: EMAIL,
      password: PASSWORD,
      name: "Ana",
    });
    expect(started.flowId).toBeTruthy();
    // nothing exists yet — the provider holds the traits, the client the password
    expect(await t.port.findByIdentifier(EMAIL.value)).toBeNull();

    const done = await t.authService.registerVerify(PUBLIC, {
      flowId: started.flowId,
      identifier: EMAIL,
      code: FAKE_CODE,
      name: "Ana",
      password: PASSWORD,
    });
    const profile = await t.userProfileRepo.findAllByUserIds(PUBLIC, [done.userId]);
    expect(profile[0]?.name).toBe("Ana");
    expect(t.registered).toEqual([done.userId]);

    // born verified — the code was the possession proof
    const identity = await t.port.getIdentity(
      (await t.port.findByIdentifier(EMAIL.value))!.id,
    );
    expect(identity.addresses[0]?.verified).toBe(true);

    // the password landed with the birth
    const login = await t.authService.loginWithPassword(PUBLIC, {
      identifier: EMAIL,
      password: PASSWORD,
    });
    expect(login.sessionToken).toBeTruthy();
  });

  it("email: refuses to register without the password the config collects", async () => {
    await expect(
      t.authService.register(PUBLIC, { identifier: EMAIL, name: "Ana" }),
    ).rejects.toThrow(/requires a password/);
  });

  it("email: the verify half demands the password too — no side door", async () => {
    // the gauntlet re-runs before birth: a verify request that lost the
    // password client-side is refused while nothing exists yet
    const started = await t.authService.register(PUBLIC, {
      identifier: EMAIL,
      password: PASSWORD,
      name: "Ana",
    });
    await expect(
      t.authService.registerVerify(PUBLIC, {
        flowId: started.flowId,
        identifier: EMAIL,
        code: FAKE_CODE,
        name: "Ana",
      }),
    ).rejects.toThrow(/requires a password/);
    expect(await t.port.findByIdentifier(EMAIL.value)).toBeNull();
  });

  it("email: enforces the config's password policy at both steps", async () => {
    await expect(
      t.authService.register(PUBLIC, {
        identifier: EMAIL,
        password: "weak",
        name: "Ana",
      }),
    ).rejects.toThrow(/password must contain/);
    const started = await t.authService.register(PUBLIC, {
      identifier: EMAIL,
      password: PASSWORD,
      name: "Ana",
    });
    await expect(
      t.authService.registerVerify(PUBLIC, {
        flowId: started.flowId,
        identifier: EMAIL,
        code: FAKE_CODE,
        name: "Ana",
        password: "weak",
      }),
    ).rejects.toThrow(/password must contain/);
  });

  it("email: a failed password set leaves a verified, passwordless, standing account", async () => {
    vi.spyOn(t.port, "setPassword").mockRejectedValueOnce(
      new Error("provider hiccup"),
    );
    const done = await registerUser(t, EMAIL, {
      password: PASSWORD,
      name: "Ana",
    });
    // the account stands, verified — only the password is missing
    expect((await t.userRepo.findByIds(PUBLIC, [done.userId]))[0] ?? null).toBeTruthy();
    expect(done.sessionToken).toBeTruthy();
    await expect(
      t.authService.loginWithPassword(PUBLIC, { identifier: EMAIL, password: PASSWORD }),
    ).rejects.toThrow(/invalid credentials/);
  });

  it("email: a provider password REFUSAL rolls the birth back — clean retry (failsafe)", async () => {
    // Unreachable while the DSL is the one authority (provider checks pinned
    // off) — this guards the day a provider upgrade grows a new check.
    vi.spyOn(t.port, "setPassword").mockRejectedValueOnce(
      new IdentityProviderError(
        "policy_violation",
        "the provider refused this password",
      ),
    );
    await expect(
      registerUser(t, EMAIL, { password: PASSWORD, name: "Ana" }),
    ).rejects.toThrow(/400:.*refused this password/);
    // unborn: nothing exists, so the redo is clean — no "already in use" trap
    expect(await t.port.findByIdentifier(EMAIL.value)).toBeNull();
    const done = await registerUser(t, EMAIL, {
      password: PASSWORD,
      name: "Ana",
    });
    expect(done.sessionToken).toBeTruthy();
  });

  it("phone: delivers a code, and the identity is born when it is proven — verified", async () => {
    const started = await t.authService.register(PUBLIC, {
      identifier: PHONE,
      name: "Zé",
    });
    // nothing exists yet
    expect(await t.port.findByIdentifier(PHONE.value)).toBeNull();

    const done = await t.authService.registerVerify(PUBLIC, {
      flowId: started.flowId,
      identifier: PHONE,
      code: FAKE_CODE,
      name: "Zé",
    });
    const identity = await t.port.findByIdentifier(PHONE.value);
    expect(identity!.addresses[0]?.verified).toBe(true); // the code proved it
    expect((await t.userProfileRepo.findAllByUserIds(PUBLIC, [done.userId]))[0]?.name).toBe("Zé");
  });

  it("phone: refuses a password (the config collects none)", async () => {
    await expect(
      t.authService.register(PUBLIC, {
        identifier: PHONE,
        password: PASSWORD,
        name: "Zé",
      }),
    ).rejects.toThrow(/registers without a password/);
  });

  it("a wrong registration code is a clean 400, never a 500", async () => {
    const started = await t.authService.register(PUBLIC, {
      identifier: PHONE,
      name: "Zé",
    });
    await expect(
      t.authService.registerVerify(PUBLIC, {
        flowId: started.flowId,
        identifier: PHONE,
        code: "000000",
        name: "Zé",
      }),
    ).rejects.toThrow(/400:.*invalid or expired code/);
  });

  it("records consent in the same request", async () => {
    await publishTestDoc(t.legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>t</p>",
    });
    const result = await registerUser(t, EMAIL, {
      password: PASSWORD,
      name: "Ana",
      consents: [{ type: "termsAndConditions", accepted: true }],
    });

    const records = await t.consentRecordRepo.findAllByUserIds([result.userId]);
    expect(records.map((r) => r.legalDocumentType)).toContain(
      "termsAndConditions",
    );
  });

  it("a failed consent write does NOT cost the person the account", async () => {
    // the legal service throws for a mandatory item the user declined
    await publishTestDoc(t.legalDocumentRepo, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>t</p>",
    });
    const result = await registerUser(t, EMAIL, {
      password: PASSWORD,
      name: "Ana",
      consents: [{ type: "termsAndConditions", accepted: false }], // mandatory!
    });
    // account still stands — the gate collects consent at /resolve
    expect((await t.userRepo.findByIds(PUBLIC, [result.userId]))[0] ?? null).toBeTruthy();
  });

  it("refuses to register without the name the config demands", async () => {
    // the fixture's profileData rule fires at registration — the same request
    // must carry the answer, not create an account the gate instantly blocks
    await expect(
      t.authService.register(PUBLIC, { identifier: EMAIL, password: PASSWORD }),
    ).rejects.toThrow(/400:.*name is required/);
    await expect(t.authService.register(PUBLIC, { identifier: PHONE })).rejects.toThrow(
      /400:.*name is required/,
    );
  });

  it("an identifier the config doesn't offer for registration is refused", async () => {
    await expect(
      t.authService.register(PUBLIC, {
        identifier: { type: "google", value: "x" },
        password: PASSWORD,
      }),
    ).rejects.toThrow(/not available for registration/);
  });

  it("invitation-only products refuse an open signup", async () => {
    const closed = build({
      authConfig: {
        ...fixtureAuthConfig,
        allowSpontaneousAccountCreation: false,
      },
    });
    await expect(
      closed.authService.register(PUBLIC, { identifier: EMAIL, password: PASSWORD }),
    ).rejects.toThrow(/by invitation only/);
    // …and allow it with one — end to end, both steps carry the invitation
    const ok = await registerUser(closed, EMAIL, {
      password: PASSWORD,
      name: "Ana",
      invitationId: "inv_1",
    });
    expect(ok.sessionToken).toBeTruthy();
  });
});

describe("auth — login", () => {
  let t: ReturnType<typeof build>;
  beforeEach(async () => {
    t = build();
    await registerUser(t, EMAIL, { password: PASSWORD, name: "Ana" });
  });

  it("password login signs in", async () => {
    const result = await t.authService.loginWithPassword(PUBLIC, {
      identifier: EMAIL,
      password: PASSWORD,
    });
    expect(result.sessionToken).toBeTruthy();
    expect(result.userId).toBeTruthy();
  });

  it("wrong password and unknown account fail IDENTICALLY", async () => {
    const wrong = await t.authService.loginWithPassword(PUBLIC, { identifier: EMAIL, password: "Wr0ng-pass!" })
      .catch((e) => e.message);
    const ghost = await t.authService.loginWithPassword(PUBLIC, {
        identifier: { type: "email", value: "ghost@test.dev" },
        password: "Wr0ng-pass!",
      })
      .catch((e) => e.message);
    expect(wrong).toBe(ghost);
    expect(wrong).toMatch(/401:.*invalid credentials/);
  });

  it("code-login start answers with a flow id for an account that does NOT exist", async () => {
    // phone is the fixture's OTP-login identifier. Register one so there is a
    // real account to compare the ghost against.
    await registerUser(t, PHONE, { name: "Zé" });

    // the decoy: indistinguishable from a real start, so nothing is enumerable
    const GHOST = { type: "phone" as const, value: "+351999999999" };
    const real = await t.authService.loginCodeStart(PUBLIC, { identifier: PHONE });
    const ghost = await t.authService.loginCodeStart(PUBLIC, { identifier: GHOST });
    expect(real.flowId).toBeTruthy();
    expect(ghost.flowId).toBeTruthy();

    // …and the decoy dies at submit exactly like a wrong code
    await expect(
      t.authService.loginCodeComplete(PUBLIC, {
        flowId: ghost.flowId,
        identifier: GHOST,
        code: FAKE_CODE,
      }),
    ).rejects.toThrow(/401:.*invalid credentials/);

    // the real one goes through
    const ok = await t.authService.loginCodeComplete(PUBLIC, {
      flowId: real.flowId,
      identifier: PHONE,
      code: FAKE_CODE,
    });
    expect(ok.sessionToken).toBeTruthy();
  });

  it("refuses a factor the config doesn't offer for that identifier", async () => {
    // the fixture gives phone no password factor for authentication
    await expect(
      t.authService.loginWithPassword(PUBLIC, { identifier: PHONE, password: PASSWORD }),
    ).rejects.toThrow(/"password" login is not available/);
    // …and the COMPLETE half re-asserts too — a provider-obtained flow id
    // can't smuggle a factor past the config (the fixture offers email no OTP)
    await expect(
      t.authService.loginCodeComplete(PUBLIC, {
        flowId: "whatever",
        identifier: EMAIL,
        code: FAKE_CODE,
      }),
    ).rejects.toThrow(/"otp" login is not available/);
  });

  it("registerVerify runs the gauntlet before touching the flow", async () => {
    // a hand-crafted verify can't smuggle past the config: the password
    // demand fires before the provider ever sees the flow id
    await expect(
      t.authService.registerVerify(PUBLIC, {
        flowId: "whatever",
        identifier: EMAIL,
        code: FAKE_CODE,
        name: "Ana",
      }),
    ).rejects.toThrow(/requires a password/);
  });

  it("a TOTP-enrolled account signs in at AAL1 — 2FA is the GATE's demand, not login's", async () => {
    // enrol totp on the account
    const login = await t.authService.loginWithPassword(PUBLIC, {
      identifier: EMAIL,
      password: PASSWORD,
    });
    const enrol = await t.port.startTotpEnrollment(login.sessionToken);
    await t.port.confirmTotpEnrollment(
      login.sessionToken,
      enrol.flowId,
      FAKE_TOTP,
    );

    // the next login is a plain sign-in at AAL1…
    const second = await t.authService.loginWithPassword(PUBLIC, {
      identifier: EMAIL,
      password: PASSWORD,
    });
    const snapshot = await t.port.whoami({ sessionToken: second.sessionToken });
    expect(snapshot.aal).toBe("aal1");
    // …and the step-up happens on the LIVE session (/me/security/step-up),
    // whenever the gate demands it for the caller's memberships
    const upgraded = await t.port.stepUpTotp(second.sessionToken, FAKE_TOTP);
    expect(upgraded.aal).toBe("aal2");
  });

  it("self-heals the app user row for an identity provisioned outside a flow", async () => {
    // a seeded admin: identity exists at the provider, no app row
    const seeded = build();
    await seeded.port.createIdentity({
      traits: { email: "admin@test.dev" },
      password: PASSWORD,
      verifiedEmails: ["admin@test.dev"],
    });
    const result = await seeded.authService.loginWithPassword(PUBLIC, {
      identifier: { type: "email", value: "admin@test.dev" },
      password: PASSWORD,
    });
    expect((await seeded.userRepo.findByIds(PUBLIC, [result.userId]))[0] ?? null).toBeTruthy();
  });
});

describe("auth — recovery", () => {
  let t: ReturnType<typeof build>;
  beforeEach(async () => {
    t = build();
    await registerUser(t, EMAIL, { password: PASSWORD, name: "Ana" });
  });

  it("start masks a non-existent account", async () => {
    const ghost = await t.authService.recoveryStart(PUBLIC, {
      identifier: { type: "email", value: "ghost@test.dev" },
    });
    expect(ghost.flowId).toBeTruthy();
  });

  it("proving the code SIGNS IN, then finish resets the password and revokes every session", async () => {
    const started = await t.authService.recoveryStart(PUBLIC, { identifier: EMAIL });
    const recovered = await t.authService.recoveryComplete(PUBLIC, {
      flowId: started.flowId,
      identifier: EMAIL,
      code: FAKE_CODE,
    });
    // the recovery proof is a credential proof — the caller is signed in
    expect(recovered.sessionToken).toBeTruthy();
    expect(recovered.userId).toBeTruthy();

    await t.authService.recoveryFinish(PUBLIC, {
      sessionToken: recovered.sessionToken,
      newPassword: "Br4nd-new-pass!",
      identifierType: "email",
    });

    // EVERY session died with the reset — the recovery one included
    await expect(
      t.port.whoami({ sessionToken: recovered.sessionToken }),
    ).rejects.toThrow();

    // the old password is dead, the new one works
    await expect(
      t.authService.loginWithPassword(PUBLIC, { identifier: EMAIL, password: PASSWORD }),
    ).rejects.toThrow(/invalid credentials/);
    const fresh = await t.authService.loginWithPassword(PUBLIC, {
      identifier: EMAIL,
      password: "Br4nd-new-pass!",
    });
    expect(fresh.sessionToken).toBeTruthy();
  });

  it("finish enforces the config's password policy", async () => {
    const started = await t.authService.recoveryStart(PUBLIC, { identifier: EMAIL });
    const recovered = await t.authService.recoveryComplete(PUBLIC, {
      flowId: started.flowId,
      identifier: EMAIL,
      code: FAKE_CODE,
    });
    await expect(
      t.authService.recoveryFinish(PUBLIC, {
        sessionToken: recovered.sessionToken,
        newPassword: "weak",
      }),
    ).rejects.toThrow(/password must contain/);
  });

  it("a wrong recovery code is a uniform 401", async () => {
    const started = await t.authService.recoveryStart(PUBLIC, { identifier: EMAIL });
    await expect(
      t.authService.recoveryComplete(PUBLIC, {
        flowId: started.flowId,
        identifier: EMAIL,
        code: "000000",
      }),
    ).rejects.toThrow(/401:.*invalid code/);
  });
});
