// =============================================================================
// Kratos adapter contract tests — run against the live dev compose stack
// (kratos on 4433/4434, maildev on 1080). Self-skips when Kratos is
// unreachable so the docker-free unit run stays green:
//
//   pnpm test:contract
// =============================================================================

import { describe, it, expect, afterAll } from "vitest";
import { authenticator } from "otplib";
import { KratosIdentityProvider } from "./kratos-identity-provider";
import { IdentityProviderError } from "../identity-provider.port";

const KRATOS_PUBLIC_URL =
  process.env.KRATOS_PUBLIC_URL ?? "http://localhost:4433";
const KRATOS_ADMIN_URL = process.env.KRATOS_ADMIN_URL ?? "http://localhost:4434";
// 127.0.0.1 (not localhost): maildev binds IPv4 only and node's fetch
// resolves localhost to ::1 first
const MAILDEV_URL = process.env.MAILDEV_URL ?? "http://127.0.0.1:1080";

const kratosUp = await fetch(`${KRATOS_PUBLIC_URL}/health/ready`)
  .then((r) => r.ok)
  .catch(() => false);

if (!kratosUp) {
  // eslint-disable-next-line no-console
  console.warn(
    `[kratos contract] SKIPPED — no Kratos at ${KRATOS_PUBLIC_URL} (run \`docker compose up -d postgres kratos\` in apps/api)`,
  );
}

const provider = new KratosIdentityProvider({
  publicUrl: KRATOS_PUBLIC_URL,
  adminUrl: KRATOS_ADMIN_URL,
});

const run = String(Date.now());
const createdIdentities: string[] = [];
const email = (tag: string) => `contract-${tag}-${run}@test.dev`;

afterAll(async () => {
  if (!kratosUp) return;
  for (const id of createdIdentities) {
    await provider.deleteIdentity(id).catch(() => undefined);
  }
});

/**
 * Courier delivery is async — poll maildev for mails to an address. The
 * verification template is code-only (no flow link), so when two flows race
 * for one address (registration auto-verification + an explicit flow), the
 * caller gets EVERY candidate code newest-first and tries them against its
 * flow.
 */
async function latestMailTo(
  address: string,
  subject: RegExp,
  { timeoutMs = 15_000 }: { timeoutMs?: number } = {},
): Promise<{ subject: string; text: string }> {
  const mails = await mailsTo(address, subject, timeoutMs);
  return mails[0];
}

async function mailsTo(
  address: string,
  subject: RegExp,
  timeoutMs = 15_000,
): Promise<Array<{ subject: string; text: string }>> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const mails = (await fetch(`${MAILDEV_URL}/email`).then((r) =>
      r.json(),
    )) as Array<{
      to: Array<{ address: string }>;
      subject: string;
      text: string;
      date: string;
    }>;
    const matches = mails
      .filter(
        (m) =>
          m.to.some((t) => t.address === address) && subject.test(m.subject),
      )
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
    if (matches.length > 0) return matches;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no "${subject}" mail for ${address} within ${timeoutMs}ms`);
}

function codeFrom(mail: { text: string }): string {
  const match = mail.text.match(/\b(\d{6})\b/);
  if (!match) throw new Error(`no 6-digit code in mail: ${mail.text.slice(0, 200)}`);
  return match[1];
}

/**
 * Try each candidate code (newest mail first) against the given flow,
 * re-polling for late-arriving mails: the flow's own mail may land after a
 * racing auto-verification mail for the same address.
 */
async function submitFirstValidVerification(
  flowId: string,
  address: string,
  { timeoutMs = 15_000 }: { timeoutMs?: number } = {},
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const tried = new Set<string>();
  let lastError: unknown;
  while (Date.now() < deadline) {
    const codes = (await mailsTo(address, /verify/i)).map(codeFrom);
    for (const code of codes) {
      if (tried.has(code)) continue;
      tried.add(code);
      try {
        await provider.submitVerification(flowId, code, {
          value: address,
          via: "email",
        });
        return;
      } catch (error) {
        lastError = error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw lastError ?? new Error(`no candidate code verified for ${address}`);
}

describe.skipIf(!kratosUp)("kratos identity provider (contract)", () => {
  it("registerPassword → whoami: session with aal1 + password method", async () => {
    const address = email("register");
    const result = await provider.registerPassword(
      { email: address },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(result.identityId);

    expect(result.sessionToken).toBeTruthy();
    const session = await provider.whoami({ sessionToken: result.sessionToken });
    expect(session.identityId).toBe(result.identityId);
    expect(session.aal).toBe("aal1");
    expect(session.methods.map((m) => m.method)).toContain("password");
  });

  it("rejects a duplicate identifier with the typed error kind", async () => {
    const address = email("dup");
    const first = await provider.registerPassword(
      { email: address },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(first.identityId);

    await expect(
      provider.registerPassword({ email: address }, "Vf9!rQ2m-Xk8u"),
    ).rejects.toMatchObject({ kind: "duplicate_identifier" });
  });

  it("loginPassword succeeds with the right password, typed error with the wrong one", async () => {
    const address = email("login");
    const created = await provider.registerPassword(
      { email: address },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(created.identityId);

    const login = await provider.loginPassword(address, "Vf9!rQ2m-Xk7t");
    expect(login.session.identityId).toBe(created.identityId);

    await expect(
      provider.loginPassword(address, "Zz1!wrong-Qq2"),
    ).rejects.toBeInstanceOf(IdentityProviderError);
  });

  it("code login: start delivers a code by mail, submit yields a session", async () => {
    const address = email("code-login");
    const created = await provider.registerPassword(
      { email: address },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(created.identityId);

    const { flowId } = await provider.startCodeLogin(address);
    const code = codeFrom(await latestMailTo(address, /log ?in/i));
    const login = await provider.submitCodeLogin(flowId, address, code);
    expect(login.session.identityId).toBe(created.identityId);
    expect(login.session.methods.map((m) => m.method)).toContain("code");
  });

  it("verification: code marks the address verified", async () => {
    const address = email("verify");
    const created = await provider.registerPassword(
      { email: address },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(created.identityId);

    const { flowId } = await provider.startVerification(address, "email");
    // two mails race for this address (auto + explicit flow); codes are the
    // only distinguisher with the code-only template
    await submitFirstValidVerification(flowId, address);

    const identity = await provider.getIdentity(created.identityId);
    expect(identity.addresses).toEqual([
      expect.objectContaining({ value: address, verified: true }),
    ]);
  });

  it("markAddressVerified: flips a registered address without a challenge", async () => {
    const address = email("mark-verified");
    const created = await provider.registerPassword(
      { email: address },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(created.identityId);

    // freshly registered password identity — the address starts unverified
    const before = await provider.getIdentity(created.identityId);
    expect(
      before.addresses.find((a) => a.value === address)?.verified,
    ).toBe(false);

    await provider.markAddressVerified(created.identityId, {
      type: "email",
      value: address,
    });

    const after = await provider.getIdentity(created.identityId);
    expect(after.addresses.find((a) => a.value === address)?.verified).toBe(
      true,
    );

    // idempotent + safe for an unknown address
    await provider.markAddressVerified(created.identityId, {
      type: "email",
      value: address,
    });
    await provider.markAddressVerified(created.identityId, {
      type: "email",
      value: "not-on-this-identity@example.com",
    });
  });

  it("recovery: code yields a session able to set a new password", async () => {
    const address = email("recovery");
    const created = await provider.registerPassword(
      { email: address },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(created.identityId);

    const { flowId } = await provider.startRecovery(address, "email");
    const code = codeFrom(await latestMailTo(address, /recover/i));
    const { sessionToken } = await provider.submitRecovery(flowId, code, {
      value: address,
      via: "email",
    });
    expect(sessionToken).toBeTruthy();

    await provider.setPassword(sessionToken, "Nk6$hB4z-Wp9r");
    const login = await provider.loginPassword(address, "Nk6$hB4z-Wp9r");
    expect(login.session.identityId).toBe(created.identityId);

    // credentialTypes reflects the credential map (the hasPassword fact)
    const identity = await provider.getIdentity(created.identityId);
    expect(identity.credentialTypes).toEqual(
      expect.arrayContaining(["password"]),
    );
  });

  it("recovery via sms rides the code-login proof (self-hosted recovery flow is email-only)", async () => {
    // The sms branch drives the code-LOGIN flow — flow creation must succeed
    // for a phone-trait identity (delivery is asynchronous and not asserted
    // here; the SMS chain is exercised end-to-end via the app + Virtual
    // Phone).
    const { identityId } = await provider.createIdentity({
      traits: { phone: "+351934111222" },
    });
    createdIdentities.push(identityId);
    const { flowId } = await provider.startRecovery("+351934111222", "sms");
    expect(flowId).toBeTruthy();
    // wrong code fails uniformly through the same submit path
    await expect(
      provider.submitRecovery(flowId, "000000", {
        value: "+351934111222",
        via: "sms",
      }),
    ).rejects.toBeInstanceOf(IdentityProviderError);
  });

  it("totp: enroll under the session, step-up raises to aal2", async () => {
    const address = email("totp");
    const created = await provider.registerPassword(
      { email: address },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(created.identityId);

    const enrollment = await provider.startTotpEnrollment(created.sessionToken);
    expect(enrollment.qrDataUrl).toMatch(/^data:image\//);
    await provider.confirmTotpEnrollment(
      created.sessionToken,
      enrollment.flowId,
      authenticator.generate(enrollment.totpSecret),
    );

    const upgraded = await provider.stepUpTotp(
      created.sessionToken,
      authenticator.generate(enrollment.totpSecret),
    );
    expect(upgraded.aal).toBe("aal2");
    expect(upgraded.methods.map((m) => m.method)).toContain("totp");
  });

  it("admin import: verified address + credentials_identifier lookup + traits patch", async () => {
    const address = email("admin");
    const { identityId } = await provider.createIdentity({
      traits: { email: address, name: "Seeded Admin" },
      password: "Jw3#pT8n-Ld5q",
      verifiedEmails: [address],
    });
    createdIdentities.push(identityId);

    const found = await provider.findByIdentifier(address);
    expect(found?.id).toBe(identityId);
    expect(found?.addresses).toEqual([
      expect.objectContaining({ value: address, verified: true }),
    ]);

    // imported credentials work immediately
    const login = await provider.loginPassword(address, "Jw3#pT8n-Ld5q");
    expect(login.session.identityId).toBe(identityId);

    await provider.updateTraits(identityId, { name: "Renamed Admin" });
    const after = await provider.getIdentity(identityId);
    expect(after.traits.name).toBe("Renamed Admin");

    // unknown identifiers resolve to null (no existence leak at this layer)
    expect(await provider.findByIdentifier(`nobody-${run}@test.dev`)).toBeNull();
  });

  it("backup codes: generate → step-up consumes one-time → totp unlink works", async () => {
    const address = email("backup");
    const created = await provider.registerPassword(
      { email: address },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(created.identityId);

    // enroll totp first (backup codes accompany 2FA)
    const enrollment = await provider.startTotpEnrollment(created.sessionToken);
    await provider.confirmTotpEnrollment(
      created.sessionToken,
      enrollment.flowId,
      authenticator.generate(enrollment.totpSecret),
    );

    const { codes } = await provider.generateBackupCodes(created.sessionToken);
    expect(codes.length).toBeGreaterThanOrEqual(3);

    // credential map reflects everything enrolled
    const identity = await provider.getIdentity(created.identityId);
    expect(identity.credentialTypes).toEqual(
      expect.arrayContaining(["password", "totp", "lookup_secret"]),
    );

    // a backup code raises AAL like totp — and is single-use
    const upgraded = await provider.stepUpBackupCode(
      created.sessionToken,
      codes[0],
    );
    expect(upgraded.aal).toBe("aal2");
    await expect(
      provider.stepUpBackupCode(created.sessionToken, codes[0]),
    ).rejects.toBeInstanceOf(IdentityProviderError);

    // unlink totp under the (now aal2) session
    await provider.disableTotp(created.sessionToken);
    const after = await provider.getIdentity(created.identityId);
    expect(after.credentialTypes).not.toContain("totp");
  });

  it("identifier slots: add a second email, log in with it, verify it, remove it", async () => {
    const first = email("slots-1");
    const second = email("slots-2");
    const created = await provider.registerPassword(
      { email: first },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(created.identityId);

    await provider.addIdentifier(created.identityId, {
      type: "email",
      value: second,
    });
    // the second address is a full login identifier with the SAME password
    const login = await provider.loginPassword(second, "Vf9!rQ2m-Xk7t");
    expect(login.session.identityId).toBe(created.identityId);
    // lookup resolves either address to the same identity
    expect((await provider.findByIdentifier(second))?.id).toBe(
      created.identityId,
    );

    // per-address verification: the code goes to the NEW address
    const { flowId } = await provider.startVerification(second, "email");
    await submitFirstValidVerification(flowId, second);
    const identity = await provider.getIdentity(created.identityId);
    expect(identity.addresses.find((a) => a.value === second)?.verified).toBe(
      true,
    );

    // removal compacts slots; the removed address stops logging in
    await provider.removeIdentifier(created.identityId, {
      type: "email",
      value: second,
    });
    await expect(
      provider.loginPassword(second, "Vf9!rQ2m-Xk7t"),
    ).rejects.toBeInstanceOf(IdentityProviderError);

    // removing the last identifier is refused
    await expect(
      provider.removeIdentifier(created.identityId, {
        type: "email",
        value: first,
      }),
    ).rejects.toMatchObject({ kind: "policy_violation" });
  });

  it("identifier slots: the email cap (3) is enforced", async () => {
    const created = await provider.registerPassword(
      { email: email("cap") },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(created.identityId);
    await provider.addIdentifier(created.identityId, {
      type: "email",
      value: email("cap-2"),
    });
    await provider.addIdentifier(created.identityId, {
      type: "email",
      value: email("cap-3"),
    });
    await expect(
      provider.addIdentifier(created.identityId, {
        type: "email",
        value: email("cap-4"),
      }),
    ).rejects.toMatchObject({ kind: "policy_violation" });
  });

  it("code registration: identity born by proving the delivered code", async () => {
    const address = email("code-reg");
    const { flowId } = await provider.startCodeRegistration({
      email: address,
    });
    const code = codeFrom(await latestMailTo(address, /regist|sign|code/i));
    const registered = await provider.submitCodeRegistration(
      flowId,
      { email: address },
      code,
    );
    createdIdentities.push(registered.identityId);

    expect(registered.sessionToken).toBeTruthy();
    const session = await provider.whoami({
      sessionToken: registered.sessionToken,
    });
    expect(session.identityId).toBe(registered.identityId);
    // proving the code verifies the address
    const identity = await provider.getIdentity(registered.identityId);
    expect(identity.addresses).toEqual([
      expect.objectContaining({ value: address, verified: true }),
    ]);
  });

  it("code registration + setPassword: the password lands with the birth", async () => {
    // Registration with a password is code-birth THEN a settings write on the
    // code-proof session — fresh enough to be privileged. The password must
    // work as a login factor immediately.
    const address = email("code-reg-pw");
    const password = "Jq8#mT5v-Zc3n";
    const { flowId } = await provider.startCodeRegistration({ email: address });
    const code = codeFrom(await latestMailTo(address, /regist|sign|code/i));
    const registered = await provider.submitCodeRegistration(
      flowId,
      { email: address },
      code,
    );
    createdIdentities.push(registered.identityId);

    await provider.setPassword(registered.sessionToken, password);
    const login = await provider.loginPassword(address, password);
    expect(login.sessionToken).toBeTruthy();
    expect(login.session.identityId).toBe(registered.identityId);
  });

  it("revokeSessions invalidates outstanding session tokens", async () => {
    const address = email("revoke");
    const created = await provider.registerPassword(
      { email: address },
      "Vf9!rQ2m-Xk7t",
    );
    createdIdentities.push(created.identityId);

    await provider.revokeSessions(created.identityId);
    await expect(
      provider.whoami({ sessionToken: created.sessionToken }),
    ).rejects.toMatchObject({ kind: "session_invalid" });
  });

  it("revokeOtherSessions kills sibling tokens but keeps the caller's", async () => {
    const address = email("revoke-others");
    const password = "Vf9!rQ2m-Xk7t";
    const created = await provider.registerPassword(
      { email: address },
      password,
    );
    createdIdentities.push(created.identityId);
    const sibling = await provider.loginPassword(address, password);
    const keeper = await provider.loginPassword(address, password);

    await provider.revokeOtherSessions(keeper.sessionToken);

    await expect(
      provider.whoami({ sessionToken: keeper.sessionToken }),
    ).resolves.toMatchObject({ identityId: created.identityId });
    await expect(
      provider.whoami({ sessionToken: sibling.sessionToken }),
    ).rejects.toMatchObject({ kind: "session_invalid" });
    await expect(
      provider.whoami({ sessionToken: created.sessionToken }),
    ).rejects.toMatchObject({ kind: "session_invalid" });
  });
});
