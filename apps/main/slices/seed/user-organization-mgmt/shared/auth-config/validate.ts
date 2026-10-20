// =============================================================================
// Config validation — cross-referential invariants (throws at config load).
//
// These relate a rule's CONDITION to its OUTCOME and the catalog capability
// flags, which TS can't express as a type. The product config calls these on
// import, so a misconfig fails dev/CI/startup immediately — no separate test
// run to remember. The legal-consent invariant is NOT here — it's enforced by
// the `LegalConsentItem` type (a compile error).
//
// AUTHORING CONVENTION (enforced by the gate tests, not expressible here):
// intent-scoped flow rules are enforced only during their flow. An obligation
// that must STAND for members (the gate evaluates membership contexts with no
// intent) must also be authored with a membership-keyed clause — see the
// system_admin rules in the product config for the pattern.
// =============================================================================

import {
  FACTORS,
  IDENTIFIERS,
  SOCIAL_IDENTIFIERS,
  type AuthAndRegistrationConfig,
  type ConditionClause,
  type FactorMethod,
  type IdentifierName,
  type OrgLifecycleEntry,
} from "./types";

/** Kratos's `min_password_length` — a DSL policy may exceed it, never relax it. */
const KRATOS_MIN_PASSWORD_LENGTH = 8;

export function validateAuthConfig(config: AuthAndRegistrationConfig): void {
  const violations: string[] = [];
  const factorFlag = (m: FactorMethod) => FACTORS.find((f) => f.name === m);
  const idAllowsOtp = (i: IdentifierName) =>
    IDENTIFIERS.find((x) => x.name === i)?.allowOtp === true;

  for (const rule of config.factors) {
    const clauses = rule.condition?.when ?? [];
    const intents = clauses.flatMap((c) =>
      c.intent === undefined
        ? []
        : Array.isArray(c.intent)
          ? c.intent
          : [c.intent],
    );
    const membershipKeyed = clauses.some(
      (c) =>
        c.membershipRole !== undefined || c.membershipOrgType !== undefined,
    );
    const { method, deliveredVia } = rule.outcome.factor;

    // deviceOtp is catalogued vocabulary without runtime support yet.
    if (method === "deviceOtp") {
      violations.push(`factor "deviceOtp" is not supported by the runtime`);
    }
    // A factor offered at authentication must be usable as a login credential.
    if (
      intents.includes("authentication") &&
      !factorFlag(method)?.canBeUsedToAuth
    ) {
      violations.push(
        `factor "${method}" is offered at authentication but canBeUsedToAuth=false`,
      );
    }
    // A factor a membership rule requires (gate/step-up) must be gate-capable.
    if (membershipKeyed && !factorFlag(method)?.canBeUsedInGate) {
      violations.push(
        `factor "${method}" is a membership/gate obligation but canBeUsedInGate=false`,
      );
    }
    // An OTP must be delivered via an OTP-capable identifier.
    if (method === "otp") {
      if (!deliveredVia) violations.push(`otp factor is missing deliveredVia`);
      else if (!idAllowsOtp(deliveredVia)) {
        violations.push(
          `otp delivered via "${deliveredVia}" but allowOtp=false`,
        );
      }
    }
    // The DSL is the ONE authority on password acceptability (the provider's
    // judgment calls are pinned off in its config), so every password rule
    // must carry a policy at least as strict as the provider's hard floor —
    // otherwise a password the DSL accepted could be refused after birth.
    if (method === "password") {
      const minLength = rule.outcome.factor.config?.minLength;
      if (minLength === undefined || minLength < KRATOS_MIN_PASSWORD_LENGTH) {
        violations.push(
          `password factor needs config.minLength >= ${KRATOS_MIN_PASSWORD_LENGTH} (the provider's floor)`,
        );
      }
    }
  }

  // An identity is born one of two ways: by proving a delivered code, or
  // through a delegated (oidc) callback. A registrable identifier must
  // therefore be code-deliverable or social — anything else (a bare
  // username) has no way to be born. Static approximation: an identifier is
  // registrable when its policy has no `when`, or any clause of it can
  // match a registration context.
  const canMatchRegistration = (c: ConditionClause) =>
    c.intent === undefined ||
    (Array.isArray(c.intent) ? c.intent : [c.intent]).includes("registration");
  for (const [name, policy] of Object.entries(config.identifiers)) {
    const identifier = name as IdentifierName;
    const when = policy?.condition?.when;
    const registrable = !when || when.some(canMatchRegistration);
    const social = (SOCIAL_IDENTIFIERS as readonly string[]).includes(
      identifier,
    );
    if (registrable && !idAllowsOtp(identifier) && !social) {
      violations.push(
        `identifier "${identifier}" is registrable but neither code-deliverable (allowOtp) nor delegated (oidc) — no way to be born`,
      );
    }
  }

  if (violations.length > 0) {
    throw new Error(`Invalid auth config:\n  - ${violations.join("\n  - ")}`);
  }
}

export function validateOrgLifecycle(entries: OrgLifecycleEntry[]): void {
  const violations: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.orgType)) {
      violations.push(`duplicate lifecycle entry for orgType "${entry.orgType}"`);
    }
    seen.add(entry.orgType);

    // A user-creatable org type must declare who owns what gets created.
    if (entry.creation.actor === "user" && !entry.creation.ownership) {
      violations.push(
        `orgType "${entry.orgType}" has creation.actor="user" but no ownership block`,
      );
    }
    if (
      entry.creation.ownership &&
      entry.creation.ownership.mode.length === 0
    ) {
      violations.push(
        `orgType "${entry.orgType}" has an ownership block with an empty mode list`,
      );
    }
    const expiresInSeconds = entry.join?.invitation.expiresInSeconds;
    if (
      expiresInSeconds !== undefined &&
      (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0)
    ) {
      violations.push(
        `orgType "${entry.orgType}" has join.invitation.expiresInSeconds=${expiresInSeconds} — must be a positive number of seconds`,
      );
    }
    // An org type nobody can create and nobody can join is dead config.
    const joinable =
      entry.join !== undefined &&
      (entry.join.invitation.allow || entry.join.spontaneous.allow);
    if (entry.creation.actor !== "developer" && !entry.creation.ownership && !joinable) {
      violations.push(`orgType "${entry.orgType}" is neither creatable nor joinable`);
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Invalid org lifecycle config:\n  - ${violations.join("\n  - ")}`,
    );
  }
}
