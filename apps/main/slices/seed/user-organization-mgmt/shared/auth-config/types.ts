// =============================================================================
// Auth-config DSL — the vocabulary and rule shapes the module's resolver reads.
//
// The module ships the engine (these types + resolver.ts + validate.ts); the
// product ships the config instance (see @configs/user-organization-mgmt).
// Two orthogonal single-valued axes describe any auth moment:
//   - intent:    the credential flow (registration | authentication | recovery)
//   - orgAction: how a membership is being established (create | join)
// create/join can layer on a registration (register + create a company); both
// are absent for the gate, which evaluates standing membership obligations.
// =============================================================================

export const IDENTIFIERS = [
  { name: "email", allowOtp: true },
  { name: "phone", allowOtp: true },
  { name: "google", allowOtp: false },
  { name: "apple", allowOtp: false },
] as const;
export type IdentifierName = (typeof IDENTIFIERS)[number]["name"];

export const SOCIAL_IDENTIFIERS = ["google", "apple"] as const;
export type SocialIdentifierName = (typeof SOCIAL_IDENTIFIERS)[number];

export const FACTORS = [
  { name: "password", canBeUsedToAuth: true, canBeUsedInGate: true },
  { name: "otp", canBeUsedToAuth: true, canBeUsedInGate: true },
  { name: "deviceOtp", canBeUsedToAuth: true, canBeUsedInGate: true },
  { name: "totp", canBeUsedToAuth: false, canBeUsedInGate: true },
  { name: "link", canBeUsedToAuth: true, canBeUsedInGate: true },
] as const;
export type FactorMethod = (typeof FACTORS)[number]["name"];

export const INTENTS = ["registration", "authentication", "recovery"] as const;
export type Intent = (typeof INTENTS)[number];

export const ORG_ACTIONS = ["create", "join"] as const;
export type OrgAction = (typeof ORG_ACTIONS)[number];

// Requirements live on one of two layers: `persistent` facts survive across
// sessions (a verified email, a granted consent); `session` facts are proven
// per session (a factor the current session authenticated with).
export const REQUIREMENTS = [
  { name: "identifier_present", layer: "persistent" },
  { name: "identifier_verified", layer: "persistent" },
  { name: "factor_session_verified", layer: "session" },
  { name: "profile_data_provided", layer: "persistent" },
  { name: "legal_consent_granted", layer: "persistent" },
] as const;
export type Requirement = (typeof REQUIREMENTS)[number]["name"];

// Org types and membership roles are product vocabulary — the engine treats
// them as opaque strings; the product config narrows them.
export type OrgTypeId = string;
export type MembershipRole = string;

// The runtime context matched against conditions. Single-valued per field.
// `intent` is absent for pure invite / gate checks; `membershipOrgType` is
// absent for org-agnostic login / spontaneous signup.
export interface EvalContext {
  intent?: Intent;
  orgAction?: OrgAction;
  membershipOrgType?: OrgTypeId;
  membershipRole?: MembershipRole;
  identifier?: IdentifierName;
}

// ─── Condition — the facts a rule matches on (uniform across every group) ────

// All keys optional. Multiple keys in one clause = AND. An array value = any-of.
export interface ConditionClause {
  intent?: Intent | Intent[];
  orgAction?: OrgAction | OrgAction[];
  identifier?: IdentifierName | IdentifierName[];
  factor?: FactorMethod | FactorMethod[];
  requirement?: Requirement | Requirement[];
  membershipOrgType?: OrgTypeId | OrgTypeId[];
  membershipRole?: MembershipRole | MembershipRole[];
}

// Fires if ANY `when` clause matches AND NO `notWhen` clause matches.
// Absent `when` = always (still subject to `notWhen`).
export interface Condition {
  when?: ConditionClause[];
  notWhen?: ConditionClause[];
}

// The invariant skeleton for the accumulating groups (factors/data/consent):
// same condition, group-specific outcome.
export type Rule<Outcome> = {
  condition?: Condition;
  outcome: Outcome;
};

// ─── Outcomes / policies ─────────────────────────────────────────────────────

export interface FactorConfig {
  minLength: number;
  requireUppercase?: boolean;
  requireNumber?: boolean;
}

export interface FactorSpec {
  method: FactorMethod;
  deliveredVia?: IdentifierName;
  config?: FactorConfig;
}

export const LEGAL_CONSENT_TYPES = [
  "termsAndConditions",
  "privacyPolicy",
  "marketing",
] as const;
export type LegalConsentType = (typeof LEGAL_CONSENT_TYPES)[number];

export type LegalConsentItem = {
  type: LegalConsentType;
} & (
  | { shown: true; consent: true; mandatory?: boolean } // shown & consented — explicit (checkbox) or implicit
  | { shown: true; consent: false; mandatory?: false } // shown, informational only — never mandatory
  | { shown: false; consent?: false; mandatory?: false } // not shown — nothing to consent to
);

// One visibility policy per identifier. Leak-proof by construction: an
// identifier is a unique key, so no second rule can re-grant what another
// restricted (a union-of-grants list can't express restrictions safely).
export interface IdentifierPolicy {
  condition?: Condition;
}

export interface FactorOutcome {
  require?: Requirement; // absent for recovery (no gate requirement)
  factor: FactorSpec; // enforced: factor rules must carry a factor
}

export interface DataOutcome {
  require: Extract<Requirement, "profile_data_provided">;
  data: string[]; // enforced: data rules must carry data
}

export interface ConsentOutcome {
  require: Extract<Requirement, "legal_consent_granted">;
  consent: LegalConsentItem[]; // enforced: legal rules must carry consent
}

// ─── Top-level auth config ───────────────────────────────────────────────────

export interface AuthAndRegistrationConfig {
  allowSpontaneousAccountCreation: boolean;
  identifiers: Partial<Record<IdentifierName, IdentifierPolicy>>; // MAP, not list
  factors: Rule<FactorOutcome>[];
  profileData: Rule<DataOutcome>[];
  legalConsent: Rule<ConsentOutcome>[];
}

// =============================================================================
// Org lifecycle — how each org type is created and joined (the create/join
// VERB, orthogonal to the auth rules above). One canonical entry shape.
// =============================================================================

export interface OrgJoinInvitationPolicy {
  allow: boolean;
  // When explicit, the invited user must explicitly accept to join.
  confirmation?: "explicit" | "implicit";
  // When true, one of the user's identifiers of the invitation's type must
  // exactly match the invitation's identifier value.
  strictEmailMatch: boolean;
  strictPhoneMatch: boolean;
  // How long a pending invitation stays acceptable. Default 172800 (48h).
  expiresInSeconds?: number;
}

export interface OrgLifecycleEntry {
  orgType: OrgTypeId;
  label: string;
  isSingleInstance: boolean; // singleton org types can exist at most once
  creation: {
    actor: "developer" | "user"; // "developer" = seeded/provisioned, never user-created
    ownership?: {
      mode: Array<"creator" | "invited">;
      membershipOwnerRole: MembershipRole;
      legalConsent?: LegalConsentItem[]; // consent the creator grants at creation
    };
  };
  join?: {
    invitation: OrgJoinInvitationPolicy;
    spontaneous: { allow: boolean };
    legalConsent?: LegalConsentItem[]; // consent granted when accepting a join
  };
  teams?: { allow: boolean };
}
