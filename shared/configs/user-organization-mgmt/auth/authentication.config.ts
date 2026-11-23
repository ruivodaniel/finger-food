/**
 * Authentication & registration config — the product's instance of the
 * auth-config DSL (see @modules/user-organization-mgmt/shared for the engine).
 *
 * Two orthogonal axes describe any auth moment: intent (registration |
 * authentication | recovery) × orgAction (create | join). The gate evaluates
 * membership contexts with NO intent, so any obligation that must stand for
 * members is authored with a membership-keyed clause (see the system_admin
 * factor rules and the profile-data `name` rule).
 *
 * Validated on import — a misconfig fails dev/CI/startup immediately.
 */

import {
  validateAuthConfig,
  type AuthAndRegistrationConfig,
  type FactorConfig,
} from "@modules/user-organization-mgmt/shared";
import { ORG_TYPE_IDS } from "./org-lifecycle.config";

export const defaultPasswordPolicy: FactorConfig = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
};

export const authenticationAndRegistration: AuthAndRegistrationConfig = {
  allowSpontaneousAccountCreation: true,

  identifiers: {
    // email — everywhere. The one identifier this product signs in with:
    // phone is deliberately absent, which removes it everywhere downstream
    // (register/login/recovery tabs, invite channels, add-identifier form).
    email: {
      condition: {},
    },
    // To offer phone sign-in, uncomment this identifier AND the two phone
    // factor rules below (register/login otp + recovery otp):
    // phone: {
    //   condition: {
    //     notWhen: [{ membershipOrgType: ["system_admin", "platform_admin"] }],
    //   },
    // },
  },

  factors: [
    {
      // email verification — registration only. The runtime delivers a code
      // to the address (not a clickable link, which isn't built yet).
      condition: { when: [{ intent: "registration", identifier: "email" }] },
      outcome: {
        require: "identifier_verified",
        factor: { method: "otp", deliveredVia: "email" },
      },
    },
    {
      // email code — the one factor of this product: register + login.
      condition: {
        when: [
          { intent: ["registration", "authentication"], identifier: "email" },
        ],
      },
      outcome: {
        require: "factor_session_verified",
        factor: { method: "otp", deliveredVia: "email" },
      },
    },
    // {
    //   // phone otp — register + login (pairs with the phone identifier above)
    //   condition: {
    //     when: [
    //       { intent: ["registration", "authentication"], identifier: "phone" },
    //     ],
    //   },
    //   outcome: {
    //     require: "factor_session_verified",
    //     factor: { method: "otp", deliveredVia: "phone" },
    //   },
    // },

    // ── Membership rules: standing obligations the gate enforces ──
    {
      // system_admin members must have a VERIFIED email (proven by an emailed
      // code — the runtime's verification mechanism)
      condition: { when: [{ membershipOrgType: "system_admin" }] },
      outcome: {
        require: "identifier_verified",
        factor: { method: "otp", deliveredVia: "email" },
      },
    },

    // ── Flow rules: recovery ──
    // {
    //   condition: { when: [{ intent: "recovery", identifier: "phone" }] },
    //   outcome: { factor: { method: "otp", deliveredVia: "phone" } },
    // },
    {
      condition: { when: [{ intent: "recovery", identifier: "email" }] },
      outcome: { factor: { method: "otp", deliveredVia: "email" } },
    },
  ],

  profileData: [
    {
      condition: {
        when: [{ intent: ["registration"] }],
      },
      outcome: { require: "profile_data_provided", data: ["name"] },
    },
    {
      condition: { when: [{ membershipOrgType: "company" }] },
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
          { membershipOrgType: [...ORG_TYPE_IDS] },
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

// Runs on import — a misconfigured rule fails loudly at load time.
validateAuthConfig(authenticationAndRegistration);
