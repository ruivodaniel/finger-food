// Wire shapes shared by the API and web layers — what routes return and
// clients consume. Persistence shapes live in api/models.

export interface ProfileView {
  name: string | null;
  image: string | null;
  /** Config-driven fields (DSL data-field names). */
  data: Record<string, unknown>;
}

export interface IdentifierView {
  type: string;
  value: string;
  verified: boolean;
}

export interface UserView {
  id: string;
  profile: ProfileView;
  identifiers: IdentifierView[];
}

export interface SecurityStatusView {
  totpEnrolled: boolean;
  backupCodesGenerated: boolean;
}

/** A caller's membership facts, keyed by org type — the gate's role input. */
export interface MembershipFacts {
  organizationId: string;
  orgType: string;
  roles: string[];
}

/** Org-targeting request header — honored only for the caller's own orgs. */
export const ACTIVE_ORG_HEADER = "x-active-organization";

export interface SessionView {
  id: string;
  userId: string;
  /** Validated echo of ACTIVE_ORG_HEADER; null → org-scoped routes 404. */
  activeOrganizationId: string | null;
  /** The caller's memberships (org type + roles) — the gate reads these. */
  memberships: MembershipFacts[];
  aal: "aal0" | "aal1" | "aal2";
  /** Proven factor methods on this session (password, code, totp, …). */
  methods: string[];
  expiresAt: string;
}

export interface OrganizationView {
  id: string;
  type: string;
  typeLabel: string;
  name: string;
  logo: string | null;
  inviteChannels: string[];
}

export interface MembershipView {
  organization: OrganizationView;
  roles: string[];
  createdAt: string;
}

/** A contact address — where the product reaches the user. No login power;
 * the first login identifier seeds the default one at birth. */
export interface UserContact {
  label: string;
  type: "email" | "phone";
  value: string;
}

export interface MemberView {
  userId: string;
  name: string | null;
  /** The member's DEFAULT contact; null when none seeded. */
  contact: UserContact | null;
  image: string | null;
  roles: string[];
  createdAt: string;
}

export interface MemberListView {
  rows: MemberView[];
  total: number;
}

/** A directory row — platform-wide listing, no membership data. */
export interface OrganizationDirectoryView {
  id: string;
  name: string;
  logo: string | null;
  type: string;
  typeLabel: string;
  /** From org metadata (`status` key); "active" when unset. */
  status: string;
}

export interface OrganizationDirectoryListView {
  rows: OrganizationDirectoryView[];
  total: number;
}

export interface InvitationView {
  id: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  status: "pending" | "accepted" | "rejected" | "revoked";
  expiresAt: string;
  createdAt: string;
}

/**
 * One of the caller's own pending invitations (`GET /me/invitations`): the
 * org it is from, and whether accepting it needs the org type's join consent
 * — a mandatory item with a published document, which only the accept page
 * collects.
 */
export interface MyInvitationView extends InvitationView {
  organization: {
    id: string;
    name: string;
    logo: string | null;
    type: string;
    typeLabel: string;
  };
  requiresConsent: boolean;
}

/** Safe projection for the capability-URL accept page (no auth required). */
export interface InvitationPublicView {
  id: string;
  organizationName: string;
  organizationLogo: string | null;
  orgType: string;
  orgTypeLabel: string;
  roles: string[];
  status: "pending" | "accepted" | "rejected" | "revoked";
  /** The invited identifier (email or phone). */
  identifier: string;
  expiresAt: string;
  /** The org type's join consent items, paired with their current documents. */
  joinConsent: ConsentItemDocumentView[];
}

export interface LegalDocumentView {
  id: string;
  type: string;
  orgTypeId: string | null;
  version: number;
  title: string;
  contentHtml: string;
  /** Null while the version is a draft. */
  publishedAt: string | null;
}

/**
 * A consent item projected for a client screen: the DSL flags that drive
 * rendering plus the current published document (null = unpublished ⇒ the
 * item is waived and must not be demanded).
 */
export interface ConsentItemDocumentView {
  type: string;
  /** True = active consent (checkbox); false = informational display only. */
  consent: boolean;
  mandatory: boolean;
  document: { id: string; title: string; version: number } | null;
}

/** Unmet consent obligations grouped by scope — the re-consent screen's input. */
export interface PendingConsentGroupView {
  /** Null = platform scope. */
  orgTypeId: string | null;
  label: string;
  items: ConsentItemDocumentView[];
}

/** One recorded consent — a row of the caller's own history, newest first. */
export interface ConsentRecordView {
  id: string;
  type: string;
  version: number;
  legalDocumentId: string;
  /** Null = platform scope. */
  orgTypeId: string | null;
  /** Where it was granted (registration, gate, org-create, …). */
  context: string;
  consentedAt: string;
}
