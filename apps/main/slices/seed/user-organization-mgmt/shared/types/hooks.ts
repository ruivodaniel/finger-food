// Lifecycle hooks the app wires at mount time — the module's outbound seam
// to cross-feature consumers (realtime, notifications, onboarding).
//
// Every emission is fire-and-forget from the module's side: it happens after the
// mutation it describes has committed, and the emitter never shapes its response
// around the outcome. Emissions never throw — the mount guards every callback
// (see api/shared/guard-hooks.ts), so consumers are ordinary async functions
// and a failing one costs a log line, never the emitter's response.

/**
 * Emission context. Empty in practice today, because emissions land after their
 * transaction closes. Declared so a consumer that later wants to enqueue durable
 * work in the emitter's transaction is a wiring change, not a signature change.
 */
export interface EmitCtx {
  tx?: unknown;
}

/**
 * An invitation was accepted. The inviter is who wants to know, and acceptance
 * — not creation — is the moment that guarantees the accepter has an account,
 * so every id here resolves to a real user.
 */
export interface InvitationAcceptedPayload {
  invitationId: string;
  organizationId: string;
  orgName: string;
  /** Who sent the invitation. */
  inviterUserId: string;
  accepterUserId: string;
  /** Display name, or null for an account that carries none yet. */
  accepterName: string | null;
  /** The roles the new membership carries, as one label. */
  role: string;
}

export interface UserOrgMgmtHooks {
  onUserRegistered?: (input: { userId: string }) => void | Promise<void>;
  onUserUpdated?: (input: { userId: string }) => void | Promise<void>;
  onInvitationAccepted?: (
    payload: InvitationAcceptedPayload,
    ctx?: EmitCtx,
  ) => void | Promise<void>;
}
