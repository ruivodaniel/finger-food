// =============================================================================
// resolver.ts — the ONE generic engine that reads the auth-config DSL.
//
// This is the shared code every consumer (registration flow, login form, the
// gate) calls. Nothing here knows about "email", "company", or any specific
// rule: it iterates the config and matches conditions against a context. Add a
// rule to the config and every caller picks it up with no change here.
//
// Uses `import type` only — no runtime dependency on any particular config.
// =============================================================================

import type {
  AuthAndRegistrationConfig,
  EvalContext,
  Condition,
  ConditionClause,
  IdentifierName,
  FactorSpec,
  FactorMethod,
  Requirement,
  LegalConsentItem,
} from "./types";

// ─── The matcher (the whole engine is built on this) ─────────────────────────

/**
 * Does a single clause match the context? Every key in the clause must be
 * present in `ctx` and its value included in the clause's any-of set. A clause
 * that names a field the context lacks does NOT match.
 */
export function clauseMatches(
  clause: ConditionClause,
  ctx: EvalContext,
): boolean {
  for (const [key, value] of Object.entries(clause)) {
    const allowed: unknown[] = Array.isArray(value) ? value : [value];
    const ctxValue = (ctx as Record<string, unknown>)[key];
    if (ctxValue === undefined) return false;
    if (!allowed.includes(ctxValue)) return false;
  }
  return true;
}

/**
 * Fires if ANY `when` clause matches AND NO `notWhen` clause matches.
 * Absent `when` = always (still subject to `notWhen`); absent condition = always.
 */
export function matches(
  condition: Condition | undefined,
  ctx: EvalContext,
): boolean {
  if (!condition) return true;
  const whenOk =
    condition.when === undefined
      ? true
      : condition.when.some((c) => clauseMatches(c, ctx));
  const notBlocked = condition.notWhen
    ? condition.notWhen.some((c) => clauseMatches(c, ctx))
    : false;
  return whenOk && !notBlocked;
}

// ─── Per-group resolvers (each caller projects what it needs) ────────────────

/** Identifier names visible in this context — reads the identifiers MAP. */
export function resolveIdentifiers(
  config: AuthAndRegistrationConfig,
  ctx: EvalContext,
): IdentifierName[] {
  const visible: IdentifierName[] = [];
  for (const [name, policy] of Object.entries(config.identifiers)) {
    if (matches(policy?.condition, ctx)) visible.push(name as IdentifierName);
  }
  return visible.sort();
}

/** Factor specs that apply in this context — union over the factors LIST. */
export function resolveFactors(
  config: AuthAndRegistrationConfig,
  ctx: EvalContext,
): FactorSpec[] {
  const out: FactorSpec[] = [];
  for (const rule of config.factors) {
    if (matches(rule.condition, ctx)) out.push(rule.outcome.factor);
  }
  return out;
}

/** Stable key for a factor spec: password | otp:phone | link:email | totp | … */
export function factorKey(f: FactorSpec): string {
  return f.deliveredVia ? `${f.method}:${f.deliveredVia}` : f.method;
}

/**
 * Requirements the context must satisfy — the GATE's projection. Collects the
 * `require` field from every matching rule across factors / profileData /
 * legalConsent. (Identifiers don't carry `require`; "at least one present" is
 * an invariant, and verification comes from the factor rules.)
 *
 * Returns what fires for the GIVEN context only. Intent-scoped flow rules are
 * enforced during their flow; an obligation that must stand for members must
 * also be authored with a membership-keyed clause (see the authoring
 * convention in validate.ts and the gate tests).
 */
export function resolveRequirements(
  config: AuthAndRegistrationConfig,
  ctx: EvalContext,
): Requirement[] {
  const out = new Set<Requirement>();
  for (const rule of config.factors) {
    if (matches(rule.condition, ctx) && rule.outcome.require)
      out.add(rule.outcome.require);
  }
  for (const rule of config.profileData) {
    if (matches(rule.condition, ctx)) out.add(rule.outcome.require);
  }
  for (const rule of config.legalConsent) {
    if (matches(rule.condition, ctx)) out.add(rule.outcome.require);
  }
  return [...out];
}

// A structured obligation — carries the SPECIFICS the gate needs to pick a
// screen (which identity, which factor, which data field, which consent), not
// just the bare `require` string.
export interface Obligation {
  require: Requirement;
  identityTypes?: IdentifierName[]; // for identifier obligations — ANY listed type satisfies
  factorMethod?: FactorMethod; // for factor obligations (password / totp / …)
  dataField?: string; // for profile-data obligations
  consent?: LegalConsentItem[]; // for legal-consent obligations
}

/**
 * The GATE's projection with specifics. Same matching engine, but each matching
 * rule becomes a typed obligation:
 *   - a factor rule with `deliveredVia` + `identifier_*` require → identity obligation
 *   - any other factor rule → factor obligation (its method)
 *   - a profileData rule → one data obligation per field
 *   - a legalConsent rule → a consent obligation
 */
export function resolveObligations(
  config: AuthAndRegistrationConfig,
  ctx: EvalContext,
): Obligation[] {
  const out: Obligation[] = [];
  for (const rule of config.factors) {
    if (!matches(rule.condition, ctx) || !rule.outcome.require) continue;
    const f = rule.outcome.factor;
    const isIdentity =
      f.deliveredVia !== undefined &&
      (rule.outcome.require === "identifier_verified" ||
        rule.outcome.require === "identifier_present");
    out.push(
      isIdentity
        ? { require: rule.outcome.require, identityTypes: [f.deliveredVia!] }
        : { require: rule.outcome.require, factorMethod: f.method },
    );
  }
  for (const rule of config.profileData) {
    if (matches(rule.condition, ctx)) {
      for (const field of rule.outcome.data)
        out.push({ require: rule.outcome.require, dataField: field });
    }
  }
  for (const rule of config.legalConsent) {
    if (matches(rule.condition, ctx))
      out.push({ require: rule.outcome.require, consent: rule.outcome.consent });
  }
  return out;
}

/** Stable identity for an obligation — used to dedupe across merged contexts. */
export function obligationKey(o: Obligation): string {
  if (o.identityTypes)
    return `${o.require}:identity:${[...o.identityTypes].sort().join("|")}`;
  if (o.factorMethod) return `${o.require}:factor:${o.factorMethod}`;
  if (o.dataField) return `${o.require}:data:${o.dataField}`;
  if (o.consent)
    return `${o.require}:consent:${o.consent.map((c) => c.type).sort().join(",")}`;
  return o.require;
}
