// =============================================================================
// Test fixture — a complete auth config exercising every DSL feature: the
// leak-proof identifier map, both condition axes (intent × orgAction),
// membership-keyed gate rules, step-up roles, and the notWhen carve-out.
// Mirrors the product config's shape so resolver tests are self-contained.
// =============================================================================

import type { AuthAndRegistrationConfig, FactorConfig } from "../types";

const defaultPasswordPolicy: FactorConfig = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
};

export const fixtureAuthConfig: AuthAndRegistrationConfig = {
  allowSpontaneousAccountCreation: true,

  // One visibility policy per identifier — an identifier is a unique key, so
  // no second rule can re-grant what another restricted.
  //
  //   COMPANY    create → email, phone           join → apple, google (social ONLY)
  //   OPS_CENTER create → email, phone, google   join → email, phone
  //   ADMIN orgs → email only, regardless of create/join
  identifiers: {
    // email — everywhere EXCEPT company-join (which is social-only)
    email: {
      condition: {
        notWhen: [{ membershipOrgType: "company", orgAction: "join" }],
      },
    },
    // phone — everywhere EXCEPT admin orgs AND company-join
    phone: {
      condition: {
        notWhen: [
          { membershipOrgType: ["system_admin", "platform_admin"] },
          { membershipOrgType: "company", orgAction: "join" },
        ],
      },
    },
    // apple — company JOIN only (a social identifier for joining a company)
    apple: {
      condition: {
        when: [{ membershipOrgType: "company", orgAction: "join" }],
      },
    },
    // google — company JOIN, OR ops_center CREATE (SSO-bootstrap a NEW ops
    // center with a Google identity; joining an existing one is email/phone)
    google: {
      condition: {
        when: [
          { membershipOrgType: "company", orgAction: "join" },
          { membershipOrgType: "ops_center", orgAction: "create" },
        ],
      },
    },
  },

  factors: [
    {
      // email magic-link — REGISTRATION only (it's the verification step)
      condition: { when: [{ intent: "registration", identifier: "email" }] },
      outcome: {
        require: "identifier_verified",
        factor: { method: "link", deliveredVia: "email" },
      },
    },
    {
      // email password — register + login, NOT recovery
      condition: {
        when: [
          { intent: ["registration", "authentication"], identifier: "email" },
        ],
      },
      outcome: {
        require: "factor_session_verified",
        factor: { method: "password", config: defaultPasswordPolicy },
      },
    },
    {
      // phone otp — register + login
      condition: {
        when: [
          { intent: ["registration", "authentication"], identifier: "phone" },
        ],
      },
      outcome: {
        require: "factor_session_verified",
        factor: { method: "otp", deliveredVia: "phone" },
      },
    },

    // ── MEMBERSHIP rule: step-up factor obligation (no intent) ──
    {
      condition: {
        when: [
          {
            membershipRole: [
              "manage_system_admin",
              "system_manage_system_admin",
            ],
          },
        ],
      },
      outcome: {
        require: "factor_session_verified",
        factor: { method: "totp" },
      },
    },
    {
      // system_admin members must have a VERIFIED email
      condition: { when: [{ membershipOrgType: "system_admin" }] },
      outcome: {
        require: "identifier_verified",
        factor: { method: "link", deliveredVia: "email" },
      },
    },
    {
      // system_admin members must hold a password-verified session. The
      // email-password flow rule above is intent-scoped, so it can't stand for
      // members — standing obligations need their own membership-keyed clause.
      condition: { when: [{ membershipOrgType: "system_admin" }] },
      outcome: {
        require: "factor_session_verified",
        factor: { method: "password", config: defaultPasswordPolicy },
      },
    },
    {
      // system_admin members must have TOTP enrolled (2FA)
      condition: { when: [{ membershipOrgType: "system_admin" }] },
      outcome: {
        require: "factor_session_verified",
        factor: { method: "totp" },
      },
    },

    // ── FLOW rules: recovery ──
    {
      condition: { when: [{ intent: "recovery", identifier: "phone" }] },
      outcome: { factor: { method: "otp", deliveredVia: "phone" } },
    },
    {
      condition: { when: [{ intent: "recovery", identifier: "email" }] },
      outcome: { factor: { method: "otp", deliveredVia: "email" } },
    },
  ],

  profileData: [
    {
      // Fires during registration AND for any org member — the membership
      // clause is what makes it STAND at the gate (no intent there).
      condition: {
        when: [
          { intent: "registration" },
          {
            membershipOrgType: [
              "system_admin",
              "platform_admin",
              "company",
              "ops_center",
            ],
          },
        ],
      },
      outcome: { require: "profile_data_provided", data: ["name"] },
    },
    {
      // Company-only. One membership-keyed clause covers BOTH moments: a
      // registration journey targeting a company (its context carries the
      // org type) and the standing gate for existing company members (no
      // intent there). Adding `intent` to this clause would silently stop
      // it from standing at the gate.
      condition: {
        when: [{ membershipOrgType: ["company"] }],
      },
      outcome: { require: "profile_data_provided", data: ["age"] },
    },
  ],

  legalConsent: [
    {
      // Fires during registration AND for any org member (gate re-check),
      // EXCEPT system_admin break-glass accounts — a notWhen carve-out.
      condition: {
        when: [
          { intent: "registration" },
          {
            membershipOrgType: [
              "system_admin",
              "platform_admin",
              "company",
              "ops_center",
            ],
          },
        ],
        notWhen: [{ membershipOrgType: "system_admin" }],
      },
      outcome: {
        require: "legal_consent_granted",
        consent: [
          {
            type: "termsAndConditions",
            shown: true,
            consent: true,
            mandatory: true,
          },
          {
            type: "privacyPolicy",
            shown: true,
            consent: true,
            mandatory: true,
          },
          { type: "marketing", shown: true, consent: true, mandatory: false },
        ],
      },
    },
  ],
};
