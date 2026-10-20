/**
 * In-memory identity port — the TEST DOUBLE for docker-free unit tests.
 * Deterministic: every challenge code is "123456"; TOTP accepts "000000".
 * Mirrors the provider's identifier caps (3 emails, 2 phones).
 * Not a runtime provider — real environments use the Kratos adapter.
 */

import {
  IdentityProviderError,
  type IdentityProviderPort,
  type IdentitySnapshot,
  type IdentityTraits,
  type SessionSnapshot,
} from "../identity/identity-provider.port";

export const FAKE_CODE = "123456";
export const FAKE_TOTP = "000000";

const CAPS = { email: 3, phone: 2 } as const;

interface FakeIdentity {
  id: string;
  emails: string[];
  phones: string[];
  name?: string;
  password?: string;
  totpEnrolled: boolean;
  backupCodes: Set<string>; // unused one-time codes
  verified: Set<string>; // identifier values marked verified
}

interface FakeSession {
  id: string;
  identityId: string;
  methods: Array<{ method: string; completedAt?: string }>;
  active: boolean;
}

interface FakeFlow {
  kind:
    | "verification"
    | "login"
    | "recovery"
    | "settings"
    | "code_registration";
  identifier?: string;
  traits?: IdentityTraits;
}

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${++seq}`;

export class FakeIdentityPort implements IdentityProviderPort {
  identities = new Map<string, FakeIdentity>();
  sessions = new Map<string, FakeSession>(); // key = session token
  flows = new Map<string, FakeFlow>();

  private values(identity: FakeIdentity): string[] {
    return [...identity.emails, ...identity.phones];
  }

  private findByValue(value: string): FakeIdentity | null {
    for (const identity of this.identities.values()) {
      if (this.values(identity).includes(value)) return identity;
    }
    return null;
  }

  private snapshot(identity: FakeIdentity): IdentitySnapshot {
    return {
      id: identity.id,
      traits: {
        email: identity.emails[0],
        phone: identity.phones[0],
        name: identity.name,
      },
      credentialTypes: [
        ...(identity.password ? ["password"] : []),
        "code",
        ...(identity.totpEnrolled ? ["totp"] : []),
        ...(identity.backupCodes.size > 0 ? ["lookup_secret"] : []),
      ],
      addresses: [
        ...identity.emails.map((value) => ({
          via: "email" as const,
          value,
          verified: identity.verified.has(value),
        })),
        ...identity.phones.map((value) => ({
          via: "sms" as const,
          value,
          verified: identity.verified.has(value),
        })),
      ],
    };
  }

  private sessionSnapshot(token: string): SessionSnapshot {
    const session = this.sessions.get(token);
    if (!session || !session.active) {
      throw new IdentityProviderError("session_invalid", "no session");
    }
    return {
      id: session.id,
      identityId: session.identityId,
      active: session.active,
      aal: session.methods.some((m) => m.method === "totp") ? "aal2" : "aal1",
      methods: session.methods,
      authenticatedAt: "",
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };
  }

  private issue(identityId: string, method: string) {
    const token = nextId("token");
    this.sessions.set(token, {
      id: nextId("session"),
      identityId,
      methods: [{ method }],
      active: true,
    });
    return { sessionToken: token, session: this.sessionSnapshot(token) };
  }

  // ── Admin plane ────────────────────────────────────────────────────────────

  async createIdentity(input: {
    traits: IdentityTraits;
    password?: string;
    verifiedEmails?: string[];
  }) {
    const values = [input.traits.email, input.traits.phone].filter(
      (v): v is string => !!v,
    );
    for (const value of values) {
      if (this.findByValue(value)) {
        throw new IdentityProviderError("duplicate_identifier", "taken");
      }
    }
    const identity: FakeIdentity = {
      id: nextId("identity"),
      emails: input.traits.email ? [input.traits.email] : [],
      phones: input.traits.phone ? [input.traits.phone] : [],
      name: input.traits.name,
      password: input.password,
      totpEnrolled: false,
      backupCodes: new Set(),
      verified: new Set(input.verifiedEmails ?? []),
    };
    this.identities.set(identity.id, identity);
    return { identityId: identity.id };
  }

  async getIdentity(identityId: string) {
    const identity = this.identities.get(identityId);
    if (!identity) {
      throw new IdentityProviderError("provider_error", "not found");
    }
    return this.snapshot(identity);
  }

  async findByIdentifier(identifier: string) {
    const identity = this.findByValue(identifier);
    return identity ? this.snapshot(identity) : null;
  }

  async addIdentifier(
    identityId: string,
    identifier: { type: "email" | "phone"; value: string },
  ) {
    const identity = this.identities.get(identityId);
    if (!identity) {
      throw new IdentityProviderError("provider_error", "not found");
    }
    const list = identifier.type === "email" ? identity.emails : identity.phones;
    if (list.includes(identifier.value)) return; // idempotent
    if (list.length >= CAPS[identifier.type]) {
      throw new IdentityProviderError(
        "policy_violation",
        `identifier limit reached (${CAPS[identifier.type]} ${identifier.type}s)`,
      );
    }
    list.push(identifier.value);
  }

  async removeIdentifier(
    identityId: string,
    identifier: { type: "email" | "phone"; value: string },
  ) {
    const identity = this.identities.get(identityId);
    if (!identity) {
      throw new IdentityProviderError("provider_error", "not found");
    }
    const list = identifier.type === "email" ? identity.emails : identity.phones;
    const index = list.indexOf(identifier.value);
    if (index === -1) return; // caller-guaranteed present; tolerate in tests
    list.splice(index, 1);
    identity.verified.delete(identifier.value);
  }

  async updateTraits(identityId: string, traits: { name?: string }) {
    const identity = this.identities.get(identityId);
    if (identity && traits.name !== undefined) identity.name = traits.name;
  }

  async markAddressVerified(
    identityId: string,
    identifier: { type: "email" | "phone"; value: string },
  ) {
    const identity = this.identities.get(identityId);
    if (identity && this.values(identity).includes(identifier.value)) {
      identity.verified.add(identifier.value);
    }
  }

  async deleteIdentity(identityId: string) {
    this.identities.delete(identityId);
  }

  async revokeSessions(identityId: string) {
    for (const session of this.sessions.values()) {
      if (session.identityId === identityId) session.active = false;
    }
  }

  // ── Session plane ──────────────────────────────────────────────────────────

  async whoami(auth: { sessionToken?: string; cookieHeader?: string }) {
    if (!auth.sessionToken) {
      throw new IdentityProviderError("session_invalid", "no token");
    }
    return this.sessionSnapshot(auth.sessionToken);
  }

  async logout(sessionToken: string) {
    const session = this.sessions.get(sessionToken);
    if (session) session.active = false;
  }

  async revokeOtherSessions(sessionToken: string) {
    const keeper = this.sessions.get(sessionToken);
    if (!keeper?.active) {
      throw new IdentityProviderError("session_invalid", "no session");
    }
    for (const [token, session] of this.sessions) {
      if (session.identityId === keeper.identityId && token !== sessionToken) {
        session.active = false;
      }
    }
  }

  // ── Flow plane ─────────────────────────────────────────────────────────────

  async registerPassword(traits: IdentityTraits, password: string) {
    const { identityId } = await this.createIdentity({ traits, password });
    const issued = this.issue(identityId, "password");
    // mirror the provider: an auto-started verification for the address
    const address = traits.email ?? traits.phone;
    let verificationFlowId: string | undefined;
    if (address) {
      verificationFlowId = nextId("flow");
      this.flows.set(verificationFlowId, {
        kind: "verification",
        identifier: address,
      });
    }
    return { identityId, ...issued, verificationFlowId };
  }

  async startCodeRegistration(traits: IdentityTraits) {
    const values = [traits.email, traits.phone].filter((v): v is string => !!v);
    for (const value of values) {
      if (this.findByValue(value)) {
        throw new IdentityProviderError("duplicate_identifier", "taken");
      }
    }
    const flowId = nextId("flow");
    this.flows.set(flowId, { kind: "code_registration", traits });
    return { flowId };
  }

  async submitCodeRegistration(
    flowId: string,
    _traits: IdentityTraits,
    code: string,
  ) {
    const flow = this.flows.get(flowId);
    if (!flow || flow.kind !== "code_registration" || code !== FAKE_CODE) {
      throw new IdentityProviderError("invalid_credentials", "bad code");
    }
    this.flows.delete(flowId);
    const { identityId } = await this.createIdentity({ traits: flow.traits! });
    const identity = this.identities.get(identityId)!;
    // proving the code verifies the registered address
    for (const value of this.values(identity)) identity.verified.add(value);
    const issued = this.issue(identityId, "code");
    return { identityId, ...issued };
  }

  async loginPassword(identifier: string, password: string) {
    const identity = this.findByValue(identifier);
    if (!identity || identity.password !== password) {
      throw new IdentityProviderError("invalid_credentials", "bad login");
    }
    return this.issue(identity.id, "password");
  }

  async startCodeLogin(identifier: string) {
    if (!this.findByValue(identifier)) {
      throw new IdentityProviderError("invalid_credentials", "unknown");
    }
    const flowId = nextId("flow");
    this.flows.set(flowId, { kind: "login", identifier });
    return { flowId };
  }

  async submitCodeLogin(flowId: string, identifier: string, code: string) {
    const flow = this.flows.get(flowId);
    const identity = this.findByValue(identifier);
    if (!flow || flow.kind !== "login" || !identity || code !== FAKE_CODE) {
      throw new IdentityProviderError("invalid_credentials", "bad code");
    }
    this.flows.delete(flowId);
    identity.verified.add(identifier); // proving a code verifies the address
    return this.issue(identity.id, "code");
  }

  async startVerification(address: string, via: "email" | "sms") {
    // Mirror the adapter: sms verification is a code login (possession
    // proof); email runs the provider's verification flow.
    if (via === "sms") {
      return this.startCodeLogin(address);
    }
    const flowId = nextId("flow");
    this.flows.set(flowId, { kind: "verification", identifier: address });
    return { flowId };
  }

  async submitVerification(
    flowId: string,
    code: string,
    identifier: { value: string; via: "email" | "sms" },
  ) {
    if (identifier.via === "sms") {
      const login = await this.submitCodeLogin(flowId, identifier.value, code);
      await this.logout(login.sessionToken); // verification mints no session
      return;
    }
    const flow = this.flows.get(flowId);
    if (!flow || flow.kind !== "verification" || code !== FAKE_CODE) {
      throw new IdentityProviderError("invalid_credentials", "bad code");
    }
    const identity = this.findByValue(flow.identifier!);
    identity?.verified.add(flow.identifier!);
    this.flows.delete(flowId);
  }

  async startRecovery(identifier: string, _via: "email" | "sms") {
    if (!this.findByValue(identifier)) {
      throw new IdentityProviderError("invalid_credentials", "unknown");
    }
    const flowId = nextId("flow");
    this.flows.set(flowId, { kind: "recovery", identifier });
    return { flowId };
  }

  async submitRecovery(
    flowId: string,
    code: string,
    _identifier: { value: string; via: "email" | "sms" },
  ) {
    const flow = this.flows.get(flowId);
    if (!flow || flow.kind !== "recovery" || code !== FAKE_CODE) {
      throw new IdentityProviderError("invalid_credentials", "bad code");
    }
    const identity = this.findByValue(flow.identifier!)!;
    this.flows.delete(flowId);
    const issued = this.issue(identity.id, "link_recovery");
    return { sessionToken: issued.sessionToken };
  }

  async setPassword(sessionToken: string, newPassword: string) {
    const session = this.sessionSnapshot(sessionToken);
    const identity = this.identities.get(session.identityId);
    if (!identity) {
      throw new IdentityProviderError("session_invalid", "gone");
    }
    identity.password = newPassword;
  }

  async startTotpEnrollment(sessionToken: string) {
    this.sessionSnapshot(sessionToken);
    const flowId = nextId("flow");
    this.flows.set(flowId, { kind: "settings" });
    return {
      flowId,
      totpSecret: "FAKESECRET",
      qrDataUrl: "data:image/png;base64,fake",
    };
  }

  async confirmTotpEnrollment(
    sessionToken: string,
    flowId: string,
    code: string,
  ) {
    const session = this.sessionSnapshot(sessionToken);
    if (!this.flows.has(flowId) || code !== FAKE_TOTP) {
      throw new IdentityProviderError("invalid_credentials", "bad totp");
    }
    const identity = this.identities.get(session.identityId);
    if (identity) identity.totpEnrolled = true;
    this.flows.delete(flowId);
  }

  async stepUpTotp(sessionToken: string, code: string) {
    const snapshot = this.sessionSnapshot(sessionToken);
    const identity = this.identities.get(snapshot.identityId);
    if (!identity?.totpEnrolled || code !== FAKE_TOTP) {
      throw new IdentityProviderError("invalid_credentials", "bad totp");
    }
    this.sessions.get(sessionToken)?.methods.push({ method: "totp" });
    return this.sessionSnapshot(sessionToken);
  }

  async disableTotp(sessionToken: string) {
    const snapshot = this.sessionSnapshot(sessionToken);
    const identity = this.identities.get(snapshot.identityId);
    if (identity) identity.totpEnrolled = false;
  }

  async generateBackupCodes(sessionToken: string) {
    const snapshot = this.sessionSnapshot(sessionToken);
    const identity = this.identities.get(snapshot.identityId)!;
    const codes = Array.from({ length: 4 }, () => nextId("backup"));
    identity.backupCodes = new Set(codes); // replaces any previous set
    return { codes };
  }

  async stepUpBackupCode(sessionToken: string, code: string) {
    const snapshot = this.sessionSnapshot(sessionToken);
    const identity = this.identities.get(snapshot.identityId);
    if (!identity?.backupCodes.has(code)) {
      throw new IdentityProviderError("invalid_credentials", "bad backup code");
    }
    identity.backupCodes.delete(code); // one-time
    this.sessions.get(sessionToken)?.methods.push({ method: "lookup_secret" });
    return this.sessionSnapshot(sessionToken);
  }
}
