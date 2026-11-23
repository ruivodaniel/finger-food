// =============================================================================
// Kratos adapter — implements the identity-provider port over Ory Kratos.
//
// Uses API-native self-service flows (`/self-service/*/api`) driven entirely
// server-side; the resulting `session_token` never leaves the backend. The
// admin API (createIdentity, lookups, revocation) must only be reachable
// cluster-internally.
// =============================================================================

import {
  IdentityProviderError,
  type IdentityProviderPort,
  type IdentitySnapshot,
  type IdentityTraits,
  type SessionSnapshot,
} from "../identity-provider.port";
import { KratosHttp, kratosError, type KratosUrls } from "./kratos-client";

export interface KratosIdentityProviderOptions extends KratosUrls {
  schemaId?: string; // identity schema id (default "default-v1")
}

// ── Kratos payload shapes (the subset the adapter reads) ─────────────────────

/**
 * Slot model: multiple login identifiers of one type are fixed schema traits
 * (identity.schema.json). Slot names never leave this adapter — the port
 * speaks { type, value } lists.
 */
const IDENTIFIER_SLOTS = {
  email: ["email", "email_2", "email_3"],
  phone: ["phone", "phone_2"],
} as const;

type IdentifierSlot =
  | (typeof IDENTIFIER_SLOTS.email)[number]
  | (typeof IDENTIFIER_SLOTS.phone)[number];

/** Raw Kratos traits — identifier slots + name. */
type KratosTraits = Partial<Record<IdentifierSlot | "name", string>>;

interface KratosIdentity {
  id: string;
  traits: KratosTraits;
  verifiable_addresses?: Array<{
    via: "email" | "sms";
    value: string;
    verified: boolean;
  }>;
  credentials?: Record<string, unknown>;
}

interface KratosSession {
  id: string;
  active?: boolean;
  authenticator_assurance_level?: "aal0" | "aal1" | "aal2";
  authentication_methods?: Array<{ method?: string; completed_at?: string }>;
  authenticated_at?: string;
  expires_at?: string;
  identity?: KratosIdentity;
}

interface KratosFlow {
  id: string;
  state?: string;
  ui?: {
    nodes?: Array<{
      type?: string;
      group?: string;
      attributes?: {
        id?: string;
        name?: string;
        src?: string;
        text?: { text?: string };
      };
    }>;
  };
}

interface KratosSessionResult {
  session_token?: string;
  session?: KratosSession;
  identity?: KratosIdentity;
  continue_with?: Array<{
    action?: string;
    flow?: { id?: string };
  }>;
}

interface KratosRecoveryResult extends KratosFlow {
  continue_with?: Array<{
    action?: string;
    ory_session_token?: string;
  }>;
}

export class KratosIdentityProvider implements IdentityProviderPort {
  private readonly pub: KratosHttp;
  private readonly admin: KratosHttp;
  private readonly schemaId: string;

  constructor(options: KratosIdentityProviderOptions) {
    this.pub = new KratosHttp(options.publicUrl);
    this.admin = new KratosHttp(options.adminUrl);
    this.schemaId = options.schemaId ?? "default-v1";
  }

  // ── Admin plane ────────────────────────────────────────────────────────────

  async createIdentity(input: {
    traits: IdentityTraits;
    password?: string;
    verifiedEmails?: string[];
  }): Promise<{ identityId: string }> {
    const identity = await this.admin.request<KratosIdentity>(
      "/admin/identities",
      {
        method: "POST",
        body: {
          schema_id: this.schemaId,
          traits: input.traits,
          ...(input.password
            ? {
                credentials: {
                  password: { config: { password: input.password } },
                },
              }
            : {}),
          ...(input.verifiedEmails?.length
            ? {
                verifiable_addresses: input.verifiedEmails.map((value) => ({
                  via: "email",
                  value,
                  verified: true,
                  status: "completed",
                })),
              }
            : {}),
        },
      },
    );
    return { identityId: identity.id };
  }

  async getIdentity(identityId: string): Promise<IdentitySnapshot> {
    const identity = await this.admin.request<KratosIdentity>(
      `/admin/identities/${identityId}`,
    );
    return toIdentitySnapshot(identity);
  }

  async findByIdentifier(identifier: string): Promise<IdentitySnapshot | null> {
    const list = await this.admin.request<KratosIdentity[]>(
      `/admin/identities?credentials_identifier=${encodeURIComponent(identifier)}`,
    );
    return list.length > 0 ? toIdentitySnapshot(list[0]) : null;
  }

  async addIdentifier(
    identityId: string,
    identifier: { type: "email" | "phone"; value: string },
  ): Promise<void> {
    const identity = await this.rawIdentity(identityId);
    const slots = IDENTIFIER_SLOTS[identifier.type];
    if (slots.some((slot) => identity.traits[slot] === identifier.value)) {
      return; // already present — idempotent
    }
    const free = slots.find((slot) => !identity.traits[slot]);
    if (!free) {
      throw new IdentityProviderError(
        "policy_violation",
        `identifier limit reached (${slots.length} ${identifier.type}s)`,
      );
    }
    await this.admin.request(`/admin/identities/${identityId}`, {
      method: "PATCH",
      body: [{ op: "add", path: `/traits/${free}`, value: identifier.value }],
    });
  }

  async removeIdentifier(
    identityId: string,
    identifier: { type: "email" | "phone"; value: string },
  ): Promise<void> {
    const identity = await this.rawIdentity(identityId);
    const remaining = {
      email: IDENTIFIER_SLOTS.email
        .map((slot) => identity.traits[slot])
        .filter((v): v is string => !!v),
      phone: IDENTIFIER_SLOTS.phone
        .map((slot) => identity.traits[slot])
        .filter((v): v is string => !!v),
    };
    remaining[identifier.type] = remaining[identifier.type].filter(
      (v) => v !== identifier.value,
    );
    // The last identifier is the account's only way in — the schema does not
    // demand one, so the port's policy is enforced here.
    if (remaining.email.length + remaining.phone.length === 0) {
      throw new IdentityProviderError(
        "policy_violation",
        "cannot remove the last identifier",
      );
    }
    // Rebuild traits with compacted slots (no holes).
    const traits: KratosTraits = {
      ...(identity.traits.name ? { name: identity.traits.name } : {}),
    };
    remaining.email.forEach((value, i) => {
      traits[IDENTIFIER_SLOTS.email[i]] = value;
    });
    remaining.phone.forEach((value, i) => {
      traits[IDENTIFIER_SLOTS.phone[i]] = value;
    });
    await this.admin.request(`/admin/identities/${identityId}`, {
      method: "PATCH",
      body: [{ op: "replace", path: "/traits", value: traits }],
    });
  }

  async updateTraits(
    identityId: string,
    traits: { name?: string },
  ): Promise<void> {
    if (traits.name === undefined) return;
    await this.admin.request(`/admin/identities/${identityId}`, {
      method: "PATCH",
      body: [{ op: "add", path: "/traits/name", value: traits.name }],
    });
  }

  async markAddressVerified(
    identityId: string,
    identifier: { type: "email" | "phone"; value: string },
  ): Promise<void> {
    const identity = await this.rawIdentity(identityId);
    const addresses = identity.verifiable_addresses ?? [];
    const index = addresses.findIndex((a) => a.value === identifier.value);
    if (index === -1 || addresses[index].verified) return; // nothing to do
    await this.admin.request(`/admin/identities/${identityId}`, {
      method: "PATCH",
      body: [
        {
          op: "replace",
          path: `/verifiable_addresses/${index}/verified`,
          value: true,
        },
        {
          op: "replace",
          path: `/verifiable_addresses/${index}/status`,
          value: "completed",
        },
      ],
    });
  }

  private async rawIdentity(identityId: string): Promise<KratosIdentity> {
    return this.admin.request<KratosIdentity>(
      `/admin/identities/${identityId}`,
    );
  }

  async deleteIdentity(identityId: string): Promise<void> {
    await this.admin.raw(`/admin/identities/${identityId}`, {
      method: "DELETE",
    });
  }

  async revokeSessions(identityId: string): Promise<void> {
    await this.admin.raw(`/admin/identities/${identityId}/sessions`, {
      method: "DELETE",
    });
  }

  // ── Session plane ──────────────────────────────────────────────────────────

  async whoami(auth: {
    sessionToken?: string;
    cookieHeader?: string;
  }): Promise<SessionSnapshot> {
    const session = await this.pub.request<KratosSession>("/sessions/whoami", {
      headers: {
        ...(auth.sessionToken ? { "X-Session-Token": auth.sessionToken } : {}),
        ...(auth.cookieHeader ? { Cookie: auth.cookieHeader } : {}),
      },
    });
    return toSessionSnapshot(session);
  }

  async logout(sessionToken: string): Promise<void> {
    await this.pub.raw("/self-service/logout/api", {
      method: "DELETE",
      body: { session_token: sessionToken },
    });
  }

  async revokeOtherSessions(sessionToken: string): Promise<void> {
    await this.pub.raw("/sessions", {
      method: "DELETE",
      headers: { "X-Session-Token": sessionToken },
    });
  }

  // ── Flow plane ─────────────────────────────────────────────────────────────

  async registerPassword(
    traits: IdentityTraits,
    password: string,
  ): Promise<{
    identityId: string;
    sessionToken: string;
    session: SessionSnapshot;
    verificationFlowId?: string;
  }> {
    const flow = await this.pub.request<KratosFlow>(
      "/self-service/registration/api",
    );
    const result = await this.pub.request<KratosSessionResult>(
      `/self-service/registration?flow=${flow.id}`,
      { method: "POST", body: { method: "password", traits, password } },
    );
    if (!result.session_token || !result.identity) {
      throw new IdentityProviderError(
        "provider_error",
        "registration returned no session",
        result,
      );
    }

    const verificationFlowId = result.continue_with?.find(
      (c) => c.action === "show_verification_ui",
    )?.flow?.id;
    return {
      identityId: result.identity.id,
      sessionToken: result.session_token,
      session: toSessionSnapshot({
        ...(result.session ?? { id: "" }),
        identity: result.identity,
      }),
      verificationFlowId,
    };
  }

  async startCodeRegistration(
    traits: IdentityTraits,
  ): Promise<{ flowId: string }> {
    const flow = await this.pub.request<KratosFlow>(
      "/self-service/registration/api",
    );
    const { status, json } = await this.pub.raw(
      `/self-service/registration?flow=${flow.id}`,
      { method: "POST", body: { method: "code", traits } },
    );
    const asFlow = json as KratosFlow;
    if (status === 400 && asFlow?.state === "sent_email") {
      return { flowId: asFlow.id };
    }
    throw kratosError(status, json);
  }

  async submitCodeRegistration(
    flowId: string,
    traits: IdentityTraits,
    code: string,
  ): Promise<{
    identityId: string;
    sessionToken: string;
    session: SessionSnapshot;
  }> {
    const result = await this.pub.request<KratosSessionResult>(
      `/self-service/registration?flow=${flowId}`,
      { method: "POST", body: { method: "code", traits, code } },
    );
    if (!result.session_token || !result.identity) {
      throw new IdentityProviderError(
        "provider_error",
        "code registration returned no session",
        result,
      );
    }
    return {
      identityId: result.identity.id,
      sessionToken: result.session_token,
      session: toSessionSnapshot({
        ...(result.session ?? { id: "" }),
        identity: result.identity,
      }),
    };
  }

  async loginPassword(
    identifier: string,
    password: string,
  ): Promise<{ sessionToken: string; session: SessionSnapshot }> {
    const flow = await this.pub.request<KratosFlow>("/self-service/login/api");
    const result = await this.pub.request<KratosSessionResult>(
      `/self-service/login?flow=${flow.id}`,
      { method: "POST", body: { method: "password", identifier, password } },
    );
    return sessionResult(result);
  }

  async startCodeLogin(identifier: string): Promise<{ flowId: string }> {
    const flow = await this.pub.request<KratosFlow>("/self-service/login/api");
    // Submitting the identifier makes Kratos generate + deliver the code; it
    // answers 400 with the flow in state "sent_email" — that's progress, not
    // failure.
    const { status, json } = await this.pub.raw(
      `/self-service/login?flow=${flow.id}`,
      { method: "POST", body: { method: "code", identifier } },
    );
    const asFlow = json as KratosFlow;
    if (status === 400 && asFlow?.state === "sent_email") {
      return { flowId: asFlow.id };
    }
    throw kratosError(status, json);
  }

  async submitCodeLogin(
    flowId: string,
    identifier: string,
    code: string,
  ): Promise<{ sessionToken: string; session: SessionSnapshot }> {
    const result = await this.pub.request<KratosSessionResult>(
      `/self-service/login?flow=${flowId}`,
      { method: "POST", body: { method: "code", identifier, code } },
    );
    return sessionResult(result);
  }

  async startVerification(
    address: string,
    via: "email" | "sms",
  ): Promise<{ flowId: string }> {
    // Kratos's verification flow is email-only; phone possession is proven
    // via a code LOGIN to the address instead (same trick recovery uses).
    // Proving the login code marks the sms address verified.
    if (via === "sms") {
      return this.startCodeLogin(address);
    }
    const flow = await this.pub.request<KratosFlow>(
      "/self-service/verification/api",
    );
    const { status, json } = await this.pub.raw(
      `/self-service/verification?flow=${flow.id}`,
      { method: "POST", body: { method: "code", email: address } },
    );
    const asFlow = json as KratosFlow;
    if ((status === 200 || status === 400) && asFlow?.state === "sent_email") {
      return { flowId: asFlow.id };
    }
    throw kratosError(status, json);
  }

  async submitVerification(
    flowId: string,
    code: string,
    identifier: { value: string; via: "email" | "sms" },
  ): Promise<void> {
    // sms: the flow is a code login (see startVerification). Proving it
    // verifies the address; the incidental session is discarded — verifying
    // an identifier must not mint one.
    if (identifier.via === "sms") {
      const login = await this.submitCodeLogin(flowId, identifier.value, code);
      await this.logout(login.sessionToken).catch(() => {
        // best effort — an unrevoked throwaway session just expires
      });
      return;
    }
    const { status, json } = await this.pub.raw(
      `/self-service/verification?flow=${flowId}`,
      { method: "POST", body: { method: "code", code } },
    );
    if (status === 401 || status === 403 || status === 410) {
      throw kratosError(status, json);
    }
    // The code strategy reports the verdict ON the flow object — a wrong
    // code can come back as 200 with the flow, or as a browser redirect
    // (303, empty body) even on API flows, in which case the flow is
    // refetched. Classify by the flow's state + message ids, not by the
    // transport status.
    const flow =
      status === 303
        ? await this.pub.request<KratosFlow>(
            `/self-service/verification/flows?id=${flowId}`,
          )
        : (json as KratosFlow);
    if (flow?.state === "passed_challenge") {
      return;
    }
    throw kratosError(400, flow ?? json);
  }

  async startRecovery(
    identifier: string,
    via: "email" | "sms",
  ): Promise<{ flowId: string }> {

    if (via === "sms") {
      return this.startCodeLogin(identifier);
    }
    const flow = await this.pub.request<KratosFlow>(
      "/self-service/recovery/api",
    );
    const { status, json } = await this.pub.raw(
      `/self-service/recovery?flow=${flow.id}`,
      { method: "POST", body: { method: "code", email: identifier } },
    );
    const asFlow = json as KratosFlow;
    if ((status === 200 || status === 400) && asFlow?.state === "sent_email") {
      return { flowId: asFlow.id };
    }
    throw kratosError(status, json);
  }

  async submitRecovery(
    flowId: string,
    code: string,
    identifier: { value: string; via: "email" | "sms" },
  ): Promise<{ sessionToken: string }> {
    if (identifier.via === "sms") {
      const login = await this.submitCodeLogin(flowId, identifier.value, code);
      return { sessionToken: login.sessionToken };
    }
    const { status, json } = await this.pub.raw(
      `/self-service/recovery?flow=${flowId}`,
      { method: "POST", body: { method: "code", code } },
    );
    // A successful recovery answers 422 ("browser location change required"
    // in API flows) carrying continue_with — including the session token.
    const result = json as KratosRecoveryResult;
    const token = result?.continue_with?.find(
      (c) => c.action === "set_ory_session_token",
    )?.ory_session_token;
    if (token) return { sessionToken: token };
    throw kratosError(status, json);
  }

  async setPassword(sessionToken: string, newPassword: string): Promise<void> {
    const flow = await this.settingsFlow(sessionToken);
    await this.pub.request(`/self-service/settings?flow=${flow.id}`, {
      method: "POST",
      headers: { "X-Session-Token": sessionToken },
      body: { method: "password", password: newPassword },
    });
  }

  async startTotpEnrollment(sessionToken: string): Promise<{
    flowId: string;
    totpSecret: string;
    qrDataUrl: string;
  }> {
    const flow = await this.settingsFlow(sessionToken);
    const nodes = flow.ui?.nodes ?? [];
    const totpSecret = nodes.find((n) => n.attributes?.id === "totp_secret_key")
      ?.attributes?.text?.text;
    const qrDataUrl = nodes.find((n) => n.attributes?.id === "totp_qr")
      ?.attributes?.src;
    if (!totpSecret || !qrDataUrl) {
      throw new IdentityProviderError(
        "provider_error",
        "settings flow exposes no TOTP enrollment (already enrolled?)",
        flow,
      );
    }
    return { flowId: flow.id, totpSecret, qrDataUrl };
  }

  async confirmTotpEnrollment(
    sessionToken: string,
    flowId: string,
    code: string,
  ): Promise<void> {
    await this.pub.request(`/self-service/settings?flow=${flowId}`, {
      method: "POST",
      headers: { "X-Session-Token": sessionToken },
      body: { method: "totp", totp_code: code },
    });
  }

  async stepUpTotp(
    sessionToken: string,
    code: string,
  ): Promise<SessionSnapshot> {
    // refresh=true is required alongside aal=aal2 — without it Kratos treats
    // the active session as final and refuses to open the step-up flow
    const flow = await this.pub.request<KratosFlow>(
      "/self-service/login/api?aal=aal2&refresh=true",
      { headers: { "X-Session-Token": sessionToken } },
    );
    await this.pub.request<KratosSessionResult>(
      `/self-service/login?flow=${flow.id}`,
      {
        method: "POST",
        headers: { "X-Session-Token": sessionToken },
        body: { method: "totp", totp_code: code },
      },
    );
    // The existing session is upgraded in place; re-read it for the new AAL.
    return this.whoami({ sessionToken });
  }

  async disableTotp(sessionToken: string): Promise<void> {
    const flow = await this.settingsFlow(sessionToken);
    await this.pub.request(`/self-service/settings?flow=${flow.id}`, {
      method: "POST",
      headers: { "X-Session-Token": sessionToken },
      body: { method: "totp", totp_unlink: true },
    });
  }

  async generateBackupCodes(
    sessionToken: string,
  ): Promise<{ codes: string[] }> {
    // Two settings submissions: regenerate answers with the fresh codes in a
    // `lookup_secret_codes` text node; confirm persists them.
    const flow = await this.settingsFlow(sessionToken);
    const regenerated = await this.pub.request<KratosFlow>(
      `/self-service/settings?flow=${flow.id}`,
      {
        method: "POST",
        headers: { "X-Session-Token": sessionToken },
        body: { method: "lookup_secret", lookup_secret_regenerate: true },
      },
    );
    const codesText = regenerated.ui?.nodes?.find(
      (n) => n.attributes?.id === "lookup_secret_codes",
    )?.attributes?.text?.text;
    if (!codesText) {
      throw new IdentityProviderError(
        "provider_error",
        "backup-code regeneration returned no codes",
        regenerated,
      );
    }
    await this.pub.request(`/self-service/settings?flow=${regenerated.id}`, {
      method: "POST",
      headers: { "X-Session-Token": sessionToken },
      body: { method: "lookup_secret", lookup_secret_confirm: true },
    });
    return { codes: codesText.split(",").map((c) => c.trim()).filter(Boolean) };
  }

  async stepUpBackupCode(
    sessionToken: string,
    code: string,
  ): Promise<SessionSnapshot> {
    const flow = await this.pub.request<KratosFlow>(
      "/self-service/login/api?aal=aal2&refresh=true",
      { headers: { "X-Session-Token": sessionToken } },
    );
    await this.pub.request<KratosSessionResult>(
      `/self-service/login?flow=${flow.id}`,
      {
        method: "POST",
        headers: { "X-Session-Token": sessionToken },
        body: { method: "lookup_secret", lookup_secret: code },
      },
    );
    return this.whoami({ sessionToken });
  }

  private async settingsFlow(sessionToken: string): Promise<KratosFlow> {
    return this.pub.request<KratosFlow>("/self-service/settings/api", {
      headers: { "X-Session-Token": sessionToken },
    });
  }
}

// ── Mapping helpers ───────────────────────────────────────────────────────────

function toIdentitySnapshot(identity: KratosIdentity): IdentitySnapshot {
  return {
    id: identity.id,
    traits: identity.traits ?? {},
    addresses: (identity.verifiable_addresses ?? []).map((a) => ({
      via: a.via,
      value: a.value,
      verified: a.verified,
    })),
    ...(identity.credentials
      ? { credentialTypes: Object.keys(identity.credentials) }
      : {}),
  };
}

function toSessionSnapshot(session: KratosSession): SessionSnapshot {
  return {
    id: session.id,
    identityId: session.identity?.id ?? "",
    active: session.active ?? true,
    aal: session.authenticator_assurance_level ?? "aal1",
    methods: (session.authentication_methods ?? []).map((m) => ({
      method: m.method ?? "unknown",
      completedAt: m.completed_at,
    })),
    authenticatedAt: session.authenticated_at ?? "",
    expiresAt: session.expires_at ?? "",
  };
}

function sessionResult(result: KratosSessionResult): {
  sessionToken: string;
  session: SessionSnapshot;
} {
  if (!result.session_token || !result.session) {
    throw new IdentityProviderError(
      "provider_error",
      "login returned no session",
      result,
    );
  }
  return {
    sessionToken: result.session_token,
    session: toSessionSnapshot(result.session),
  };
}
