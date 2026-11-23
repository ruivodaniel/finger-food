/**
 * Registry of pages we want to snapshot — shared by `layouts/map` and
 * `layouts/snapshots`. Hand-maintained.
 *
 * `cast`     — id of the persona to sign in as. Omit for incognito (anonymous).
 * `activeOrg`— if set, switch to this org (by name) via the sidebar
 *              org-switcher before navigating to the page. Org names must
 *              match the visible label in the org-switcher dropdown.
 */

export type SnapshotAction =
  /** Click an element by `data-testid`. */
  | { type: "click"; testId: string }
  /** Fill an input by `data-testid`. */
  | { type: "fill"; testId: string; value: string }
  /** Wait `ms` milliseconds (e.g. let an opening sheet animate in). */
  | { type: "wait"; ms: number };

export type SnapshotPage = {
  /** Stable slug — also the cache filename and url-safe identifier. */
  id: string;
  /** Same-origin path on the dev server. */
  url: string;
  /** Human label shown in the gallery + manager. */
  label: string;
  /** Optional grouping for the menu. */
  group?: string;
  /** Cast member id. Undefined → incognito Playwright context. */
  cast?: string;
  /** Switch to this org (by display name) before navigating. */
  activeOrg?: string;
  /** Optional pre-snapshot actions — e.g. open a sheet by clicking its trigger. */
  actions?: SnapshotAction[];
};

// Most authenticated pages snapshot as Daniel with Platform Admin as the
// active org. Override per page when needed.
const DEFAULT_CAST = "daniel";
const DEFAULT_ORG = "Platform Admin";

export const SNAPSHOT_PAGES: SnapshotPage[] = [
  // ── Auth (incognito — no cast) ──────────────────────────────
  { id: "auth-login",    url: "/login",    label: "Sign in",  group: "Auth" },
  { id: "auth-register", url: "/register", label: "Register", group: "Auth" },

  // ── Home ────────────────────────────────────────────────────
  { id: "dashboard", url: "/dashboard", label: "Dashboard", group: "Home", cast: DEFAULT_CAST, activeOrg: DEFAULT_ORG },

  // ── Onboarding / gates ──────────────────────────────────────
  // Note: `/resolve` may behave differently per cast (depends on what
  // requirements that user has unmet). Daniel + Platform Admin probably
  // bypasses it; if so, change cast to a fresh one once we have one.
  { id: "unmet-requirements-gate", url: "/resolve", label: "Unmet requirements gate", group: "Onboarding", cast: DEFAULT_CAST, activeOrg: DEFAULT_ORG },

  // ── Legal (public) ──────────────────────────────────────────
  {
    id: "legal-terms",
    url: "/legal-documents?type=termsAndConditions",
    label: "Legal · Terms & Conditions",
    group: "Legal (public)",
  },

  // ── Legal (admin) ───────────────────────────────────────────
  {
    id: "manage-legal-platform-terms",
    url: "/manage-legal-documents/terms-and-conditions/platform",
    label: "Manage · Platform T&C",
    group: "Legal (admin)",
    cast: DEFAULT_CAST,
    activeOrg: DEFAULT_ORG,
  },

  // ── Settings ────────────────────────────────────────────────
  { id: "settings-account",     url: "/my/settings/account",     label: "Settings · Account",     group: "Settings", cast: DEFAULT_CAST, activeOrg: DEFAULT_ORG },
  { id: "settings-security",    url: "/my/settings/security",    label: "Settings · Security",    group: "Settings", cast: DEFAULT_CAST, activeOrg: DEFAULT_ORG },
  { id: "settings-legal",       url: "/my/settings/legal",       label: "Settings · Legal",       group: "Settings", cast: DEFAULT_CAST, activeOrg: DEFAULT_ORG },
  { id: "settings-preferences", url: "/my/settings/preferences", label: "Settings · Preferences", group: "Settings", cast: DEFAULT_CAST, activeOrg: DEFAULT_ORG },

  // ── Organizations ───────────────────────────────────────────
  {
    id: "organizations-list",
    url: "/organizations",
    label: "Organizations · List",
    group: "Organizations",
    cast: DEFAULT_CAST,
    activeOrg: DEFAULT_ORG,
  },
  {
    id: "organizations-list-create-sheet",
    url: "/organizations",
    label: "Organizations · List · Create sheet",
    group: "Organizations",
    cast: DEFAULT_CAST,
    activeOrg: DEFAULT_ORG,
    actions: [
      { type: "click", testId: "org-create-btn" },
      { type: "wait", ms: 400 },
    ],
  },
  {
    id: "organization-info",
    url: "/organizations/BV7GDgktFPtIwJHQbCI9Zf68rccUmFh7/info",
    label: "Organization · Info",
    group: "Organizations",
    cast: DEFAULT_CAST,
    activeOrg: DEFAULT_ORG,
  },
  {
    id: "organization-members",
    url: "/organizations/BV7GDgktFPtIwJHQbCI9Zf68rccUmFh7/members",
    label: "Organization · Members",
    group: "Organizations",
    cast: DEFAULT_CAST,
    activeOrg: DEFAULT_ORG,
  },
  {
    id: "organization-members-invite-sheet",
    url: "/organizations/BV7GDgktFPtIwJHQbCI9Zf68rccUmFh7/members",
    label: "Organization · Members · Invite sheet",
    group: "Organizations",
    cast: DEFAULT_CAST,
    activeOrg: DEFAULT_ORG,
    actions: [
      { type: "click", testId: "members-invite-btn" },
      { type: "wait", ms: 400 },
    ],
  },

];
