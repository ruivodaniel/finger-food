/**
 * What this slice needs to spend credits, in its own words. It imports nothing
 * from the slice that provides it: the app passes an implementation at mount,
 * and an app without credits passes none and meteors are free.
 */

export type MeteorChargeResult = { ok: true } | { ok: false; reason: "entitlement" | "balance" | "allowance" };

export interface MeteorCredits {
  /** Before the action runs. The same `ref` twice is the same charge. */
  charge(owner: { organizationId: string }, input: { service: string; units: number; ref: string; userId: string }): Promise<MeteorChargeResult>;
  /** Reverses the charge of `ref`, once. */
  refund(input: { ref: string }): Promise<{ refunded: boolean }>;
}
