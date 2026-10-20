// =============================================================================
// Identity-provider port — the module's ONLY seam to the identity system.
//
// The provider owns identities, credentials, verification/recovery challenges,
// and sessions. Because the provider also owns code generation, delivery, and
// flow state, challenge-shaped operations are flow-handle pairs
// (`start*` → { flowId } → `submit*`) rather than stateless predicates; the
// port never leaks provider flow objects or UI nodes — only handles, tokens,
// and typed results.
//
// Sessions: `whoami` accepts either a server-held session token (API flows) or
// a raw Cookie header (the OIDC browser hop) and reports the session's
// assurance level + proven methods — the gate's session-layer facts.
// =============================================================================

export interface IdentityTraits {
  email?: string;
  phone?: string;
  name?: string;
}

export interface IdentityAddress {
  via: "email" | "sms";
  value: string;
  verified: boolean;
}

/** A provider channel, in the DSL's identifier vocabulary. */
export const identifierTypeOf = (via: "email" | "sms"): "email" | "phone" =>
  via === "sms" ? "phone" : "email";

/** An identifier type, in the provider's channel vocabulary. */
export const viaOf = (type: "email" | "phone"): "email" | "sms" =>
  type === "phone" ? "sms" : "email";

export interface IdentitySnapshot {
  id: string;
  traits: IdentityTraits;
  addresses: IdentityAddress[];
  credentialTypes?: string[];
}

export interface SessionMethod {
  method: string; // password | code | totp | oidc | link_recovery | …
  completedAt?: string;
}

export interface SessionSnapshot {
  id: string;
  identityId: string;
  active: boolean;
  aal: "aal0" | "aal1" | "aal2";
  methods: SessionMethod[];
  authenticatedAt: string;
  expiresAt: string;
}

/** Thrown for provider-reported failures the caller must branch on. */
export class IdentityProviderError extends Error {
  constructor(
    public readonly kind:
      | "invalid_credentials" // wrong password / wrong code
      | "duplicate_identifier" // identifier already taken
      | "flow_expired" // start* handle no longer valid
      | "session_invalid" // no/expired session
      | "reauthentication_required" // session too old for a privileged change
      | "policy_violation" // e.g. password too weak per provider policy
      | "provider_error", // anything else (5xx, unexpected shape)
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "IdentityProviderError";
  }
}

export interface IdentityProviderPort {
  // ── Admin plane ────────────────────────────────────────────────────────────

  /** Provision an identity directly (seeding). Addresses may be pre-verified. */
  createIdentity(input: {
    traits: IdentityTraits;
    password?: string;
    verifiedEmails?: string[];
  }): Promise<{ identityId: string }>;

  getIdentity(identityId: string): Promise<IdentitySnapshot>;

  /** Look an identity up by a credential identifier (email/phone value). */
  findByIdentifier(identifier: string): Promise<IdentitySnapshot | null>;

  /**
   * Add a login identifier (starts unverified — run a verification flow
   * after). Capacity is provider-bounded (3 emails, 2 phones); exceeding it
   * fails with `policy_violation`.
   */
  addIdentifier(
    identityId: string,
    identifier: { type: "email" | "phone"; value: string },
  ): Promise<void>;

  /**
   * Remove a login identifier — mechanical. The caller guarantees the
   * identifier exists on the identity and isn't its last one (the user
   * service owns both rules; per-membership usability is the gate's
   * standing invariant).
   */
  removeIdentifier(
    identityId: string,
    identifier: { type: "email" | "phone"; value: string },
  ): Promise<void>;

  /** Merge NON-identifier traits (name). Identifiers go through add/remove. */
  updateTraits(identityId: string, traits: { name?: string }): Promise<void>;

  /**
   * Mark a registered address verified without a challenge — the caller has
   * already proven possession out of band (e.g. an invitation delivered to
   * that address). No-op if the address isn't a verifiable one on the
   * identity, or is already verified.
   */
  markAddressVerified(
    identityId: string,
    identifier: { type: "email" | "phone"; value: string },
  ): Promise<void>;

  deleteIdentity(identityId: string): Promise<void>;

  /** Revoke every session of an identity (recovery hygiene, offboarding). */
  revokeSessions(identityId: string): Promise<void>;

  // ── Session plane ──────────────────────────────────────────────────────────

  whoami(auth: {
    sessionToken?: string;
    cookieHeader?: string;
  }): Promise<SessionSnapshot>;

  logout(sessionToken: string): Promise<void>;

  /** Revoke every OTHER session of this token's identity — this one survives. */
  revokeOtherSessions(sessionToken: string): Promise<void>;

  // ── Flow plane (self-service) ──────────────────────────────────────────────

  /**
   * Register with an identifier + password. Returns a live session, and —
   * when the provider auto-started a verification for the new address —
   * that verification's flow handle (submit its mailed code instead of
   * starting a second verification).
   */
  registerPassword(
    traits: IdentityTraits,
    password: string,
  ): Promise<{
    identityId: string;
    sessionToken: string;
    session: SessionSnapshot;
    verificationFlowId?: string;
  }>;

  /**
   * Passwordless code registration — the identity exists only after the
   * delivered code is proven. The provider generates + delivers the code at
   * start; submit creates the identity (address pre-verified by the code)
   * and returns a live session.
   */
  startCodeRegistration(traits: IdentityTraits): Promise<{ flowId: string }>;
  submitCodeRegistration(
    flowId: string,
    traits: IdentityTraits,
    code: string,
  ): Promise<{
    identityId: string;
    sessionToken: string;
    session: SessionSnapshot;
  }>;

  /** Password login. The check and the session are one operation. */
  loginPassword(
    identifier: string,
    password: string,
  ): Promise<{ sessionToken: string; session: SessionSnapshot }>;

  /** Passwordless code (OTP) login — code is generated and delivered by the provider. */
  startCodeLogin(identifier: string): Promise<{ flowId: string }>;
  submitCodeLogin(
    flowId: string,
    identifier: string,
    code: string,
  ): Promise<{ sessionToken: string; session: SessionSnapshot }>;

  /**
   * Address verification — code delivered via email or sms. The identifier
   * is echoed at submit so the adapter can drive whichever flow the channel
   * requires (same contract as recovery: a provider whose verification flow
   * is email-only proves phone possession via a code login instead,
   * discarding the incidental session).
   */
  startVerification(
    address: string,
    via: "email" | "sms",
  ): Promise<{ flowId: string }>;
  submitVerification(
    flowId: string,
    code: string,
    identifier: { value: string; via: "email" | "sms" },
  ): Promise<void>;

  /**
   * Account recovery — prove possession of a registered address via a
   * delivered code; yields a privileged session (able to set a password,
   * revoke sessions). `via` selects the delivery channel; the identifier is
   * echoed at submit so the provider adapter can drive whichever flow the
   * channel requires.
   */
  startRecovery(
    identifier: string,
    via: "email" | "sms",
  ): Promise<{ flowId: string }>;
  submitRecovery(
    flowId: string,
    code: string,
    identifier: { value: string; via: "email" | "sms" },
  ): Promise<{ sessionToken: string }>;

  /** Set a new password on the session's identity (settings flow). */
  setPassword(sessionToken: string, newPassword: string): Promise<void>;

  /** TOTP enrollment happens under the user's own session (settings flow). */
  startTotpEnrollment(sessionToken: string): Promise<{
    flowId: string;
    totpSecret: string;
    qrDataUrl: string;
  }>;
  confirmTotpEnrollment(
    sessionToken: string,
    flowId: string,
    code: string,
  ): Promise<void>;

  /** Prove TOTP on an existing session, raising it to AAL2. */
  stepUpTotp(sessionToken: string, code: string): Promise<SessionSnapshot>;

  /** Remove the TOTP credential (settings flow; provider may demand AAL2). */
  disableTotp(sessionToken: string): Promise<void>;

  /**
   * (Re)generate one-time backup codes — the lost-authenticator escape
   * hatch. Replaces any previous set; codes are returned ONCE.
   */
  generateBackupCodes(sessionToken: string): Promise<{ codes: string[] }>;

  /** Prove a backup code on an existing session, raising it to AAL2 (consumes the code). */
  stepUpBackupCode(
    sessionToken: string,
    code: string,
  ): Promise<SessionSnapshot>;
}
