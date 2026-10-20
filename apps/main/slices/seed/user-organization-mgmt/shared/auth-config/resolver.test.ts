// =============================================================================
// Resolver tests — the four projections over the shared engine, exercised
// against the fixture config: identifier visibility (the leak-proof map),
// factor visibility, gate requirements (membership contexts, no intent), and
// structured obligations.
// =============================================================================

import { describe, it, expect } from "vitest";
import { fixtureAuthConfig } from "./__fixtures__/auth.fixture.config";
import type { EvalContext } from "./types";
import {
  resolveIdentifiers,
  resolveFactors,
  resolveRequirements,
  resolveObligations,
  factorKey,
} from "./resolver";

const sorted = (xs: string[]) => [...xs].sort();

// ─── Identifier visibility ────────────────────────────────────────────────────

describe("identifier visibility", () => {
  const SCENARIOS: Array<{ name: string; ctx: EvalContext; expected: string[] }> = [
    // ── org-agnostic ──
    { name: "login", ctx: { intent: "authentication" }, expected: ["email", "phone"] },
    { name: "spontaneous signup", ctx: { intent: "registration" }, expected: ["email", "phone"] },

    // ── company: CREATE vs JOIN differ (social is join-only) ──
    { name: "register + create company", ctx: { intent: "registration", membershipOrgType: "company", orgAction: "create" }, expected: ["email", "phone"] },
    { name: "register + join company (accept invite) — social only", ctx: { intent: "registration", membershipOrgType: "company", orgAction: "join" }, expected: ["apple", "google"] },
    { name: "create org, invite owner → company", ctx: { membershipOrgType: "company", orgAction: "create" }, expected: ["email", "phone"] },

    // ── ops_center: google (SSO) is offered on CREATE only ──
    { name: "create ops_center — google via SSO", ctx: { intent: "registration", membershipOrgType: "ops_center", orgAction: "create" }, expected: ["email", "phone", "google"] },
    { name: "join ops_center", ctx: { intent: "registration", membershipOrgType: "ops_center", orgAction: "join" }, expected: ["email", "phone"] },

    // ── admin orgs: email only, regardless of create/join ──
    { name: "join → platform_admin", ctx: { intent: "registration", membershipOrgType: "platform_admin", orgAction: "join" }, expected: ["email"] },
    { name: "join → system_admin", ctx: { intent: "registration", membershipOrgType: "system_admin", orgAction: "join" }, expected: ["email"] },
    { name: "create org, invite owner → system_admin", ctx: { membershipOrgType: "system_admin", orgAction: "create" }, expected: ["email"] },
  ];

  for (const { name, ctx, expected } of SCENARIOS) {
    it(`${name} → [${sorted(expected).join(", ") || "∅"}]`, () => {
      expect(resolveIdentifiers(fixtureAuthConfig, ctx)).toEqual(sorted(expected));
    });
  }
});

// ─── Factor visibility ────────────────────────────────────────────────────────

describe("factor visibility", () => {
  const resolveKeys = (ctx: EvalContext) =>
    [...new Set(resolveFactors(fixtureAuthConfig, ctx).map(factorKey))].sort();

  const SCENARIOS: Array<{ name: string; ctx: EvalContext; expected: string[] }> = [
    { name: "email registration", ctx: { intent: "registration", identifier: "email" }, expected: ["link:email", "password"] },
    { name: "email authentication", ctx: { intent: "authentication", identifier: "email" }, expected: ["password"] },
    { name: "phone registration", ctx: { intent: "registration", identifier: "phone" }, expected: ["otp:phone"] },
    { name: "phone authentication", ctx: { intent: "authentication", identifier: "phone" }, expected: ["otp:phone"] },
    { name: "email recovery", ctx: { intent: "recovery", identifier: "email" }, expected: ["otp:email"] },
    { name: "phone recovery", ctx: { intent: "recovery", identifier: "phone" }, expected: ["otp:phone"] },
    { name: "manage_system_admin step-up", ctx: { membershipRole: "manage_system_admin" }, expected: ["totp"] },
  ];

  for (const { name, ctx, expected } of SCENARIOS) {
    it(`${name} → [${sorted(expected).join(", ") || "∅"}]`, () => {
      expect(resolveKeys(ctx)).toEqual(sorted(expected));
    });
  }
});

// ─── Gate requirements ────────────────────────────────────────────────────────
// The gate runs with a MEMBERSHIP context (no intent). These scenarios prove
// the authoring convention: standing obligations are membership-keyed, so they
// fire without an intent; and the notWhen carve-out (system_admin skips
// consent) holds.

describe("gate requirements", () => {
  const resolve = (ctx: EvalContext): string[] =>
    [...resolveRequirements(fixtureAuthConfig, ctx)].sort();

  const SCENARIOS: Array<{ name: string; ctx: EvalContext; expected: string[] }> = [
    // ── GATE: standing obligations for an existing member (NO intent) ──
    { name: "gate: company member", ctx: { membershipOrgType: "company" }, expected: ["legal_consent_granted", "profile_data_provided"] },
    { name: "gate: platform_admin member", ctx: { membershipOrgType: "platform_admin" }, expected: ["legal_consent_granted", "profile_data_provided"] },
    { name: "gate: system_admin member (email+password+totp, consent exempt)", ctx: { membershipOrgType: "system_admin" }, expected: ["factor_session_verified", "identifier_verified", "profile_data_provided"] },
    { name: "gate: admin step-up role", ctx: { membershipRole: "manage_system_admin" }, expected: ["factor_session_verified"] },

    // ── REGISTRATION: full obligation set collected at signup ──
    { name: "registration into company", ctx: { intent: "registration", membershipOrgType: "company", identifier: "email" },
      expected: ["factor_session_verified", "identifier_verified", "legal_consent_granted", "profile_data_provided"] },
  ];

  for (const { name, ctx, expected } of SCENARIOS) {
    it(`${name} → [${sorted(expected).join(", ") || "∅"}]`, () => {
      expect(resolve(ctx)).toEqual(sorted(expected));
    });
  }
});

// ─── Structured obligations ───────────────────────────────────────────────────

describe("gate obligations (structured)", () => {
  const obligations = (ctx: EvalContext) =>
    resolveObligations(fixtureAuthConfig, ctx);

  it("system_admin member owes verified email + password + totp + name (consent exempt)", () => {
    const obs = obligations({ membershipOrgType: "system_admin" });
    const identities = obs.flatMap((o) => o.identityTypes ?? []);
    const factors = obs.filter((o) => o.factorMethod).map((o) => o.factorMethod);
    const dataFields = obs.filter((o) => o.dataField).map((o) => o.dataField);
    const consents = obs.filter((o) => o.consent);

    expect(identities).toContain("email"); // must have a verified email
    expect(factors).toEqual(expect.arrayContaining(["password", "totp"]));
    expect(dataFields).toContain("name");
    expect(consents).toHaveLength(0); // notWhen exempts system_admin
    // the email obligation is the verified kind
    expect(obs.find((o) => o.identityTypes?.includes("email"))?.require).toBe(
      "identifier_verified",
    );
  });

  it("company member owes name + consent, no factor obligations", () => {
    const obs = obligations({ membershipOrgType: "company" });
    expect(obs.filter((o) => o.factorMethod)).toHaveLength(0);
    expect(obs.filter((o) => o.dataField).map((o) => o.dataField)).toContain("name");
    const consent = obs.find((o) => o.consent);
    expect(consent?.consent).toHaveLength(3); // terms, privacy, marketing
  });
});
