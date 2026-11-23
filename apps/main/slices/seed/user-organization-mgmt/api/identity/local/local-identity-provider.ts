/**
 * Local identity provider — the port, backed by the app's own Postgres. No external
 * identity service. It supports what the app uses: identities with email addresses,
 * email-code registration and login, address verification, recovery by code, and
 * server-held sessions. Passwords, TOTP, backup codes and sms are not supported and
 * say so: turn them off in the auth config.
 *
 * Codes are 6 digits, hashed, valid for 10 minutes, and burn after 5 wrong attempts.
 * Session tokens are random and stored hashed. Sessions are always AAL1.
 */

import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  uomIdentity,
  uomIdentityAddress,
  uomIdentityFlow,
  uomIdentitySession,
} from "../../models/identity.model";
import {
  IdentityProviderError,
  type IdentityProviderPort,
  type IdentitySnapshot,
  type IdentityTraits,
  type SessionSnapshot,
} from "../identity-provider.port";

export type CodePurpose = "registration" | "login" | "verification" | "recovery";

export interface LocalIdentityProviderOptions {
  db: NodePgDatabase<Record<string, unknown>>;
  createId: () => string;
  /** Deliver a one-time code to an address. The app injects its email transport. */
  sendCode: (to: string, code: string, purpose: CodePurpose) => Promise<void>;
  /** Session lifetime. Default 30 days. */
  sessionTtlMs?: number;
  /** Code lifetime. Default 10 minutes. */
  codeTtlMs?: number;
}

const CAPS = { email: 3, phone: 2 } as const;
const MAX_ATTEMPTS = 5;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
const normalize = (value: string) => value.trim().toLowerCase();
const unsupported = (what: string) =>
  new IdentityProviderError("provider_error", `${what} is not supported by the local identity provider`);

export class LocalIdentityProvider implements IdentityProviderPort {
  private readonly db: LocalIdentityProviderOptions["db"];
  private readonly createId: () => string;
  private readonly sendCode: LocalIdentityProviderOptions["sendCode"];
  private readonly sessionTtl: number;
  private readonly codeTtl: number;

  constructor(options: LocalIdentityProviderOptions) {
    this.db = options.db;
    this.createId = options.createId;
    this.sendCode = options.sendCode;
    this.sessionTtl = options.sessionTtlMs ?? 30 * 24 * 3600_000;
    this.codeTtl = options.codeTtlMs ?? 10 * 60_000;
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private async addressRow(value: string) {
    const [row] = await this.db.select().from(uomIdentityAddress).where(eq(uomIdentityAddress.value, normalize(value))).limit(1);
    return row ?? null;
  }

  private async snapshot(identityId: string): Promise<IdentitySnapshot> {
    const [identity] = await this.db.select().from(uomIdentity).where(eq(uomIdentity.id, identityId)).limit(1);
    if (!identity) throw new IdentityProviderError("provider_error", "identity not found");
    const addresses = await this.db.select().from(uomIdentityAddress).where(eq(uomIdentityAddress.identityId, identityId));
    return {
      id: identity.id,
      traits: {
        email: addresses.find((a) => a.via === "email")?.value,
        phone: addresses.find((a) => a.via === "sms")?.value,
        name: identity.name ?? undefined,
      },
      credentialTypes: ["code"],
      addresses: addresses.map((a) => ({ via: a.via, value: a.value, verified: a.verified })),
    };
  }

  private async insertIdentity(traits: IdentityTraits, verified: boolean): Promise<string> {
    const values = [traits.email, traits.phone].filter((v): v is string => !!v);
    for (const value of values) {
      if (await this.addressRow(value)) throw new IdentityProviderError("duplicate_identifier", "identifier already taken");
    }
    const id = this.createId(), now = new Date();
    await this.db.insert(uomIdentity).values({ id, name: traits.name ?? null, createdAt: now });
    for (const [via, value] of [["email", traits.email], ["sms", traits.phone]] as const) {
      if (!value) continue;
      await this.db.insert(uomIdentityAddress).values({ id: this.createId(), identityId: id, via, value: normalize(value), verified, createdAt: now });
    }
    return id;
  }

  private async issue(identityId: string, method: string): Promise<{ sessionToken: string; session: SessionSnapshot }> {
    const token = randomBytes(32).toString("base64url"), now = new Date();
    const row = { id: this.createId(), tokenHash: sha256(token), identityId, methods: [{ method, completedAt: now.toISOString() }], active: true, authenticatedAt: now, expiresAt: new Date(now.getTime() + this.sessionTtl) };
    await this.db.insert(uomIdentitySession).values(row);
    return { sessionToken: token, session: this.toSession(row) };
  }

  private toSession(row: { id: string; identityId: string; active: boolean; methods: { method: string; completedAt?: string }[]; authenticatedAt: Date; expiresAt: Date }): SessionSnapshot {
    return { id: row.id, identityId: row.identityId, active: row.active, aal: "aal1", methods: row.methods, authenticatedAt: row.authenticatedAt.toISOString(), expiresAt: row.expiresAt.toISOString() };
  }

  private async sessionByToken(token: string) {
    const [row] = await this.db.select().from(uomIdentitySession).where(eq(uomIdentitySession.tokenHash, sha256(token))).limit(1);
    if (!row || !row.active || row.expiresAt.getTime() < Date.now()) throw new IdentityProviderError("session_invalid", "no active session");
    return row;
  }

  private async startFlow(kind: "code_registration" | "login" | "verification" | "recovery", to: string, purpose: CodePurpose, traits?: IdentityTraits): Promise<{ flowId: string }> {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0"), flowId = this.createId();
    await this.db.insert(uomIdentityFlow).values({ id: flowId, kind, identifier: normalize(to), traits: traits ?? null, codeHash: sha256(flowId + ":" + code), attempts: 0, expiresAt: new Date(Date.now() + this.codeTtl) });
    await this.sendCode(normalize(to), code, purpose);
    return { flowId };
  }

  /** Check a code against a flow; a wrong code counts, the right one burns the flow. */
  private async consumeFlow(flowId: string, kind: string, code: string) {
    const [flow] = await this.db.select().from(uomIdentityFlow).where(eq(uomIdentityFlow.id, flowId)).limit(1);
    if (!flow || flow.kind !== kind) throw new IdentityProviderError("flow_expired", "flow not found");
    if (flow.expiresAt.getTime() < Date.now() || flow.attempts >= MAX_ATTEMPTS) {
      await this.db.delete(uomIdentityFlow).where(eq(uomIdentityFlow.id, flowId));
      throw new IdentityProviderError("flow_expired", "flow expired");
    }
    if (!same(flow.codeHash, sha256(flowId + ":" + code.trim()))) {
      await this.db.update(uomIdentityFlow).set({ attempts: flow.attempts + 1 }).where(eq(uomIdentityFlow.id, flowId));
      throw new IdentityProviderError("invalid_credentials", "wrong code");
    }
    await this.db.delete(uomIdentityFlow).where(eq(uomIdentityFlow.id, flowId));
    return flow;
  }

  private requireEmail(via: "email" | "sms") {
    if (via !== "email") throw unsupported("sms");
  }

  // ── Admin plane ────────────────────────────────────────────────────────────

  async createIdentity(input: { traits: IdentityTraits; password?: string; verifiedEmails?: string[] }) {
    if (input.password) throw unsupported("passwords");
    const identityId = await this.insertIdentity(input.traits, false);
    for (const email of input.verifiedEmails ?? []) await this.markAddressVerified(identityId, { type: "email", value: email });
    return { identityId };
  }

  getIdentity(identityId: string) {
    return this.snapshot(identityId);
  }

  async findByIdentifier(identifier: string) {
    const row = await this.addressRow(identifier);
    return row ? this.snapshot(row.identityId) : null;
  }

  async addIdentifier(identityId: string, identifier: { type: "email" | "phone"; value: string }) {
    const via = identifier.type === "email" ? "email" : "sms";
    const addresses = await this.db.select().from(uomIdentityAddress).where(and(eq(uomIdentityAddress.identityId, identityId), eq(uomIdentityAddress.via, via)));
    if (addresses.some((a) => a.value === normalize(identifier.value))) return;
    if (addresses.length >= CAPS[identifier.type]) throw new IdentityProviderError("policy_violation", `identifier limit reached (${CAPS[identifier.type]} ${identifier.type}s)`);
    if (await this.addressRow(identifier.value)) throw new IdentityProviderError("duplicate_identifier", "identifier already taken");
    await this.db.insert(uomIdentityAddress).values({ id: this.createId(), identityId, via, value: normalize(identifier.value), verified: false, createdAt: new Date() });
  }

  async removeIdentifier(identityId: string, identifier: { type: "email" | "phone"; value: string }) {
    await this.db.delete(uomIdentityAddress).where(and(eq(uomIdentityAddress.identityId, identityId), eq(uomIdentityAddress.value, normalize(identifier.value))));
  }

  async updateTraits(identityId: string, traits: { name?: string }) {
    if (traits.name !== undefined) await this.db.update(uomIdentity).set({ name: traits.name }).where(eq(uomIdentity.id, identityId));
  }

  async markAddressVerified(identityId: string, identifier: { type: "email" | "phone"; value: string }) {
    await this.db.update(uomIdentityAddress).set({ verified: true }).where(and(eq(uomIdentityAddress.identityId, identityId), eq(uomIdentityAddress.value, normalize(identifier.value))));
  }

  async deleteIdentity(identityId: string) {
    await this.db.delete(uomIdentitySession).where(eq(uomIdentitySession.identityId, identityId));
    await this.db.delete(uomIdentityAddress).where(eq(uomIdentityAddress.identityId, identityId));
    await this.db.delete(uomIdentity).where(eq(uomIdentity.id, identityId));
  }

  async revokeSessions(identityId: string) {
    await this.db.update(uomIdentitySession).set({ active: false }).where(eq(uomIdentitySession.identityId, identityId));
  }

  // ── Session plane ──────────────────────────────────────────────────────────

  async whoami(auth: { sessionToken?: string; cookieHeader?: string }) {
    if (!auth.sessionToken) throw new IdentityProviderError("session_invalid", "no session token");
    return this.toSession(await this.sessionByToken(auth.sessionToken));
  }

  async logout(sessionToken: string) {
    await this.db.update(uomIdentitySession).set({ active: false }).where(eq(uomIdentitySession.tokenHash, sha256(sessionToken)));
  }

  async revokeOtherSessions(sessionToken: string) {
    const keeper = await this.sessionByToken(sessionToken);
    await this.db.update(uomIdentitySession).set({ active: false }).where(and(eq(uomIdentitySession.identityId, keeper.identityId), ne(uomIdentitySession.id, keeper.id)));
  }

  // ── Flow plane ─────────────────────────────────────────────────────────────

  registerPassword(): never {
    throw unsupported("passwords");
  }

  async startCodeRegistration(traits: IdentityTraits) {
    if (traits.phone) throw unsupported("sms");
    if (!traits.email) throw new IdentityProviderError("policy_violation", "an email is required");
    if (await this.addressRow(traits.email)) throw new IdentityProviderError("duplicate_identifier", "identifier already taken");
    return this.startFlow("code_registration", traits.email, "registration", traits);
  }

  async submitCodeRegistration(flowId: string, _traits: IdentityTraits, code: string) {
    const flow = await this.consumeFlow(flowId, "code_registration", code);
    const identityId = await this.insertIdentity(flow.traits ?? {}, true); // the code proves the address
    return { identityId, ...(await this.issue(identityId, "code")) };
  }

  loginPassword(): never {
    throw unsupported("passwords");
  }

  async startCodeLogin(identifier: string) {
    if (!(await this.addressRow(identifier))) throw new IdentityProviderError("invalid_credentials", "unknown identifier");
    return this.startFlow("login", identifier, "login");
  }

  async submitCodeLogin(flowId: string, identifier: string, code: string) {
    const flow = await this.consumeFlow(flowId, "login", code);
    const row = await this.addressRow(identifier);
    if (!row || flow.identifier !== normalize(identifier)) throw new IdentityProviderError("invalid_credentials", "wrong identifier");
    await this.markAddressVerified(row.identityId, { type: row.via === "email" ? "email" : "phone", value: row.value });
    return this.issue(row.identityId, "code");
  }

  async startVerification(address: string, via: "email" | "sms") {
    this.requireEmail(via);
    return this.startFlow("verification", address, "verification");
  }

  async submitVerification(flowId: string, code: string, identifier: { value: string; via: "email" | "sms" }) {
    this.requireEmail(identifier.via);
    const flow = await this.consumeFlow(flowId, "verification", code);
    const row = await this.addressRow(flow.identifier ?? identifier.value);
    if (row) await this.markAddressVerified(row.identityId, { type: "email", value: row.value });
  }

  async startRecovery(identifier: string, via: "email" | "sms") {
    this.requireEmail(via);
    if (!(await this.addressRow(identifier))) throw new IdentityProviderError("invalid_credentials", "unknown identifier");
    return this.startFlow("recovery", identifier, "recovery");
  }

  async submitRecovery(flowId: string, code: string, identifier: { value: string; via: "email" | "sms" }) {
    this.requireEmail(identifier.via);
    const flow = await this.consumeFlow(flowId, "recovery", code);
    const row = await this.addressRow(flow.identifier ?? identifier.value);
    if (!row) throw new IdentityProviderError("invalid_credentials", "unknown identifier");
    const { sessionToken } = await this.issue(row.identityId, "link_recovery");
    return { sessionToken };
  }

  setPassword(): never {
    throw unsupported("passwords");
  }

  startTotpEnrollment(): never {
    throw unsupported("TOTP");
  }

  confirmTotpEnrollment(): never {
    throw unsupported("TOTP");
  }

  stepUpTotp(): never {
    throw unsupported("TOTP");
  }

  disableTotp(): never {
    throw unsupported("TOTP");
  }

  generateBackupCodes(): never {
    throw unsupported("backup codes");
  }

  stepUpBackupCode(): never {
    throw unsupported("backup codes");
  }
}
