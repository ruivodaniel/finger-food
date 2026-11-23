// Access-control config for user-organization-mgmt, authored against the new
// `@libs/gated-scoped-ac` DSL. Pure declarative data (CFG1): the only calls are
// the lib's `definePermissions` / `registerPermissions` / `registerForests`
// (permission builder + the two loader-validators). No env reads, no branching.
//
// Model (AC24/AC26/AC27): permissions are LEAVES (entity + action + optional
// narrowing rule); roles are BRANCHES; one independent forest per org archetype
// plus the account baseline. An ANCESTOR role inherits its DESCENDANTS' leaves —
// the owner at the top of a tree resolves the union of every role beneath it, so
// owner = most powerful (cascading resolved at runtime — UOM11). Permission and
// role names are
// globally unique (AC29), verb+entity with an archetype qualifier when scoped
// (AC30). Subject references are nested `$session.*` paths (D3); org-type lives
// at the engine default `$session.organization.type` (not overridden).
//
// Entity names key the app's drizzle-tables map at boot (injected in the app
// shell, not here): organization · membership · invitation · user ·
// user_profile · user_preferences · user_contact · legal_document ·
// consent_record.
//
// Translated from the old string-DSL rules (company + account baseline) and the
// `AC(scoped-ac):` markers in the UoM api. Notes entities and
// `organization_contact` are NOT carried over — no models/markers exist for
// them (AC35). Cross-org provisioning, `view_any_*` break-glass reads, and the
// org/invitation `delete` actions the old rules carried are dropped: no marker
// consumes them (AC35 / unconsumed = deleted).

import {
  definePermissions,
  impliedRoles,
  registerForests,
  registerPermissions,
  type RoleNode,
} from "@libs/gated-scoped-ac";

// ── archetype context gates (in-memory; bag vs literal) ──────────────────────
const IN_COMPANY = {
  bag: "$session.organization.type",
  has: { value: "company" },
} as const;
const IN_MUSICAL_PROJECT = {
  bag: "$session.organization.type",
  has: { value: "musical_project" },
} as const;
const IN_PLATFORM_ADMIN = {
  bag: "$session.organization.type",
  has: { value: "platform_admin" },
} as const;
const IN_SYSTEM_ADMIN = {
  bag: "$session.organization.type",
  has: { value: "system_admin" },
} as const;

// ── payload gates (create-only; bag vs bag, in memory) ───────────────────────
// A create has no row to scope, so the org it writes into is checked on the
// incoming row: the invitation must be FOR the active org. Dropping this from
// a rule is what would let that role invite into any org named in the URL.
const INTO_ACTIVE_ORG = {
  bag: "$requestBody.organizationId",
  is: { bag: "$session.organization.id" },
} as const;
// A document lock on one of the active company's meteors: the meteor it names belongs to the active org. The join
// reads the gate's db, which reads each meteor's current version, so it matches identities. A target that joins holds
// only the join, so the lock's kind isn't checked here: only a meteor lock names a meteor's id (ids are unique cuids).
const LOCK_ON_COMPANY_METEOR = [
  {
    field: "document_lock.documentId",
    join: "meteor",
    where: { field: "meteor.organizationId", has: { bag: "$session.organization.id" } },
  },
] as const;
// The same, for a lock being created: the row it writes names a meteor of the active org. Its kind is the slice's to
// check: only a kind a slice plugged in can be locked.
const LOCKING_COMPANY_METEOR = [
  {
    bag: "$requestBody.documentId",
    join: "meteor",
    where: { field: "meteor.organizationId", has: { bag: "$session.organization.id" } },
  },
] as const;
// The row must be the caller's own: its `userId` is the session user. The
// gate puts the row it inserts on the bag, so this holds whatever the service
// stamped.
const FOR_SELF = {
  bag: "$requestBody.userId",
  is: { bag: "$session.user.id" },
} as const;

// ── ACCOUNT BASELINE — every authenticated user, any/no active org ───────────
// User-level (no archetype context). Self-scoped by `$session.user.*`. `create`
// actions carry no target (AC33): the service stamps the owning user id, and
// the self-owned creates (consent, profile, contact, preferences) check that
// stamp on the row itself with the FOR_SELF payload. This is where the old
// create-with-target rules (`write_own_consent`, self profile/contact) collapse
// to payload creates.
const accountBaselinePermissions = definePermissions([
  {
    // A signed-in user founds a company. Each org type a user may found has its
    // own create permission; the Platform Admin is the system admin's
    // (`create_platform_admin_organization`), the System Admin only the seed's.
    name: "create_company_organization",
    entity: "organization",
    actions: ["create"],
    rules: [
      {
        context: [],
        target: [],
        payload: [{ bag: "$requestBody.type", is: { value: "company" } }],
      },
    ],
  },
  {
    // Not consumed yet, kept on purpose: the base of the parental-control
    // showcase, where a signed-in guardian creates a dependant's profile (a
    // sibling permission with a payload join to the guardian relation). The
    // registration write is not this: it runs before any session, on the
    // hydration path.
    name: "create_own_profile",
    entity: "user_profile",
    actions: ["create"],
    rules: [{ context: [], target: [], payload: [FOR_SELF] }],
  },
  {
    name: "manage_own_profile",
    entity: "user_profile",
    actions: ["read", "update", "delete"],
    rules: [
      {
        context: [],
        target: [
          { field: "user_profile.userId", has: { bag: "$session.user.id" } },
        ],
      },
    ],
  },
  {
    // The caller's preferences row (`user_preferences`, keyed by user id). The
    // service stamps the caller's own id on create, and FOR_SELF checks that
    // stamp on the row; read/update are own-row.
    name: "create_own_preferences",
    entity: "user_preferences",
    actions: ["create"],
    rules: [{ context: [], target: [], payload: [FOR_SELF] }],
  },
  {
    name: "manage_own_preferences",
    entity: "user_preferences",
    actions: ["read", "update"],
    rules: [
      {
        context: [],
        target: [
          { field: "user_preferences.userId", has: { bag: "$session.user.id" } },
        ],
      },
    ],
  },
  {
    // Not consumed yet, kept on purpose: the parental-control showcase's base,
    // as create_own_profile. The registration seed of the default contact runs
    // on the hydration path.
    name: "create_own_contact",
    entity: "user_contact",
    actions: ["create"],
    rules: [{ context: [], target: [], payload: [FOR_SELF] }],
  },
  {
    name: "manage_own_contacts",
    entity: "user_contact",
    actions: ["read", "delete"],
    rules: [
      {
        context: [],
        target: [
          { field: "user_contact.userId", has: { bag: "$session.user.id" } },
        ],
      },
    ],
  },
  {
    name: "record_own_consent",
    entity: "consent_record",
    actions: ["create"],
    rules: [{ context: [], target: [], payload: [FOR_SELF] }],
  },
  {
    name: "view_own_consent",
    entity: "consent_record",
    actions: ["read"],
    rules: [
      {
        context: [],
        target: [
          { field: "consent_record.userId", has: { bag: "$session.user.id" } },
        ],
      },
    ],
  },
  {
    // No route reaches user.delete yet (the ban/delete lifecycle, UOM8). The old
    // config was silent on it; scoped to self here (least privilege) rather than
    // inventing an unsourced cross-user admin delete (AC35).
    name: "delete_own_account",
    entity: "user",
    actions: ["delete"],
    rules: [
      {
        context: [],
        target: [{ field: "user.id", has: { bag: "$session.user.id" } }],
      },
    ],
  },
]);

// ── COMPANY archetype ────────────────────────────────────────────────────────
const companyPermissions = definePermissions([
  {
    name: "read_organization_company",
    entity: "organization",
    actions: ["read"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          { field: "organization.id", has: { bag: "$session.organization.id" } },
        ],
      },
    ],
  },
  {
    name: "update_organization_company",
    entity: "organization",
    actions: ["update"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          { field: "organization.id", has: { bag: "$session.organization.id" } },
        ],
      },
    ],
  },
  {
    name: "list_members_company",
    entity: "membership",
    actions: ["read"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          {
            field: "membership.organizationId",
            has: { bag: "$session.organization.id" },
          },
        ],
      },
    ],
  },
  {
    name: "manage_members_company",
    entity: "membership",
    actions: ["update", "delete"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          {
            field: "membership.organizationId",
            has: { bag: "$session.organization.id" },
          },
        ],
      },
    ],
  },
  {
    name: "create_invitation_company",
    entity: "invitation",
    actions: ["create"],
    rules: [{ context: [IN_COMPANY], target: [], payload: [INTO_ACTIVE_ORG] }],
  },
  // ── meteors (product slice) — the company's; published ones are public, no rule
  {
    name: "read_meteor_company",
    entity: "meteor",
    actions: ["read"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          { field: "meteor.organizationId", has: { bag: "$session.organization.id" } },
        ],
      },
    ],
  },
  {
    name: "create_meteor_company",
    entity: "meteor",
    actions: ["create"],
    rules: [{ context: [IN_COMPANY], target: [], payload: [INTO_ACTIVE_ORG] }],
  },
  {
    name: "manage_meteor_company",
    entity: "meteor",
    actions: ["update", "delete"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          { field: "meteor.organizationId", has: { bag: "$session.organization.id" } },
        ],
      },
    ],
  },
  // ── document locks (collaboration slice) — a company locks and unlocks its meteors; members see the locks
  {
    name: "read_lock_company",
    entity: "document_lock",
    actions: ["read"],
    rules: [{ context: [IN_COMPANY], target: [...LOCK_ON_COMPANY_METEOR] }],
  },
  {
    name: "create_lock_company",
    entity: "document_lock",
    actions: ["create"],
    rules: [{ context: [IN_COMPANY], target: [], payload: [...LOCKING_COMPANY_METEOR] }],
  },
  {
    name: "delete_lock_company",
    entity: "document_lock",
    actions: ["delete"],
    rules: [{ context: [IN_COMPANY], target: [...LOCK_ON_COMPANY_METEOR] }],
  },
  {
    name: "manage_invitations_company",
    entity: "invitation",
    actions: ["read", "update"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          {
            field: "invitation.organizationId",
            has: { bag: "$session.organization.id" },
          },
        ],
      },
    ],
  },
]);

// ── MUSICAL_PROJECT archetype ────────────────────────────────────────────────
const musicalProjectPermissions = definePermissions([
  {
    name: "read_organization_musical_project",
    entity: "organization",
    actions: ["read"],
    rules: [
      {
        context: [IN_MUSICAL_PROJECT],
        target: [
          { field: "organization.id", has: { bag: "$session.organization.id" } },
        ],
      },
    ],
  },
  {
    name: "update_organization_musical_project",
    entity: "organization",
    actions: ["update"],
    rules: [
      {
        context: [IN_MUSICAL_PROJECT],
        target: [
          { field: "organization.id", has: { bag: "$session.organization.id" } },
        ],
      },
    ],
  },
  {
    name: "list_members_musical_project",
    entity: "membership",
    actions: ["read"],
    rules: [
      {
        context: [IN_MUSICAL_PROJECT],
        target: [
          {
            field: "membership.organizationId",
            has: { bag: "$session.organization.id" },
          },
        ],
      },
    ],
  },
  {
    name: "manage_members_musical_project",
    entity: "membership",
    actions: ["update", "delete"],
    rules: [
      {
        context: [IN_MUSICAL_PROJECT],
        target: [
          {
            field: "membership.organizationId",
            has: { bag: "$session.organization.id" },
          },
        ],
      },
    ],
  },
  {
    name: "create_invitation_musical_project",
    entity: "invitation",
    actions: ["create"],
    rules: [
      { context: [IN_MUSICAL_PROJECT], target: [], payload: [INTO_ACTIVE_ORG] },
    ],
  },
  {
    name: "manage_invitations_musical_project",
    entity: "invitation",
    actions: ["read", "update"],
    rules: [
      {
        context: [IN_MUSICAL_PROJECT],
        target: [
          {
            field: "invitation.organizationId",
            has: { bag: "$session.organization.id" },
          },
        ],
      },
    ],
  },
]);

// ── PLATFORM_ADMIN archetype ─────────────────────────────────────────────────
const platformAdminPermissions = definePermissions([
  {
    name: "read_organization_platform",
    entity: "organization",
    actions: ["read"],
    rules: [
      {
        context: [IN_PLATFORM_ADMIN],
        target: [
          { field: "organization.id", has: { bag: "$session.organization.id" } },
        ],
      },
    ],
  },
  {
    // Own-org settings (name/logo) — owner-only in the forest, unlike company
    // where the manager tier carries it.
    name: "update_organization_platform",
    entity: "organization",
    actions: ["update"],
    rules: [
      {
        context: [IN_PLATFORM_ADMIN],
        target: [
          { field: "organization.id", has: { bag: "$session.organization.id" } },
        ],
      },
    ],
  },
  {
    name: "manage_members_platform",
    entity: "membership",
    actions: ["read", "update", "delete"],
    rules: [
      {
        context: [IN_PLATFORM_ADMIN],
        target: [
          {
            field: "membership.organizationId",
            has: { bag: "$session.organization.id" },
          },
        ],
      },
    ],
  },
  {
    name: "create_invitation_platform",
    entity: "invitation",
    actions: ["create"],
    rules: [
      { context: [IN_PLATFORM_ADMIN], target: [], payload: [INTO_ACTIVE_ORG] },
    ],
  },
  {
    name: "manage_invitations_platform",
    entity: "invitation",
    actions: ["read", "update"],
    rules: [
      {
        context: [IN_PLATFORM_ADMIN],
        target: [
          {
            field: "invitation.organizationId",
            has: { bag: "$session.organization.id" },
          },
        ],
      },
    ],
  },
  {
    // The platform's view of its customers — every company org's details (the
    // `GET /organizations` directory and `GET /organizations/:orgId`), from the
    // platform-admin context. Read only: editing a company stays its own.
    name: "read_company_organizations_platform",
    entity: "organization",
    actions: ["read"],
    rules: [
      {
        context: [IN_PLATFORM_ADMIN],
        target: [{ field: "organization.type", has: { value: "company" } }],
      },
    ],
  },
  {
    // …and their members (`GET /organizations/:orgId/members`). Read only:
    // managing them stays pinned to the active org.
    name: "read_company_members_platform",
    entity: "membership",
    actions: ["read"],
    rules: [
      {
        context: [IN_PLATFORM_ADMIN],
        target: [
          {
            field: "membership.organizationId",
            join: "organization",
            where: { field: "organization.type", has: { value: "company" } },
          },
        ],
      },
    ],
  },
  {
    // Every person's profile and every org, unscoped, from the platform-admin
    // context. Read only.
    name: "read_all_profiles_platform",
    entity: "user_profile",
    actions: ["read"],
    rules: [{ context: [IN_PLATFORM_ADMIN], target: [] }],
  },
  {
    name: "read_all_organizations_platform",
    entity: "organization",
    actions: ["read"],
    rules: [{ context: [IN_PLATFORM_ADMIN], target: [] }],
  },
  {
    // Legal-document authoring across every scope (platform + org-type docs):
    // list, draft read, save-draft (create new version / edit existing / discard),
    // publish. Target [] = all rows, so `create` is legal alongside the rest. The
    // PUBLIC published-document read is not gated here — it runs before any
    // session (AC22); the engine gates only the draft/admin branch.
    name: "manage_legal_document_platform",
    entity: "legal_document",
    actions: ["read", "create", "update", "delete"],
    rules: [{ context: [IN_PLATFORM_ADMIN], target: [] }],
  },
]);

// ── SYSTEM_ADMIN archetype ───────────────────────────────────────────────────
const systemAdminPermissions = definePermissions([
  {
    name: "read_organization_system",
    entity: "organization",
    actions: ["read"],
    rules: [
      {
        context: [IN_SYSTEM_ADMIN],
        target: [
          { field: "organization.id", has: { bag: "$session.organization.id" } },
        ],
      },
    ],
  },
  {
    name: "update_organization_system",
    entity: "organization",
    actions: ["update"],
    rules: [
      {
        context: [IN_SYSTEM_ADMIN],
        target: [
          { field: "organization.id", has: { bag: "$session.organization.id" } },
        ],
      },
    ],
  },
  {
    // Break-glass directory read — every org, unscoped (the `GET /organizations`
    // platform directory). Translates the old `view_any` org read.
    name: "read_all_organizations_system",
    entity: "organization",
    actions: ["read"],
    rules: [{ context: [IN_SYSTEM_ADMIN], target: [] }],
  },
  {
    // Cross-org members read — every org's members, from the system-admin
    // context (`GET /organizations/:orgId/members` for an org the admin is not
    // a member of). Read only: managing them stays pinned to the active org.
    name: "read_all_members_system",
    entity: "membership",
    actions: ["read"],
    rules: [{ context: [IN_SYSTEM_ADMIN], target: [] }],
  },
  {
    // Break-glass on document locks — every lock in every company: the system
    // admin's locks list, and unlocking what anyone locked.
    name: "read_all_locks_system",
    entity: "document_lock",
    actions: ["read"],
    rules: [{ context: [IN_SYSTEM_ADMIN], target: [] }],
  },
  {
    name: "delete_all_locks_system",
    entity: "document_lock",
    actions: ["delete"],
    rules: [{ context: [IN_SYSTEM_ADMIN], target: [] }],
  },
  {
    name: "manage_members_system",
    entity: "membership",
    actions: ["read", "update", "delete"],
    rules: [
      {
        context: [IN_SYSTEM_ADMIN],
        target: [
          {
            field: "membership.organizationId",
            has: { bag: "$session.organization.id" },
          },
        ],
      },
    ],
  },
  {
    name: "create_invitation_system",
    entity: "invitation",
    actions: ["create"],
    rules: [
      { context: [IN_SYSTEM_ADMIN], target: [], payload: [INTO_ACTIVE_ORG] },
    ],
  },
  {
    name: "manage_invitations_system",
    entity: "invitation",
    actions: ["read", "update"],
    rules: [
      {
        context: [IN_SYSTEM_ADMIN],
        target: [
          {
            field: "invitation.organizationId",
            has: { bag: "$session.organization.id" },
          },
        ],
      },
    ],
  },
  {
    // Only the system admin founds the Platform Admin organization, and is
    // seated as its owner; from inside it they invite the real owner.
    name: "create_platform_admin_organization",
    entity: "organization",
    actions: ["create"],
    rules: [
      {
        context: [IN_SYSTEM_ADMIN],
        target: [],
        payload: [{ bag: "$requestBody.type", is: { value: "platform_admin" } }],
      },
    ],
  },
]);

// ── CREDITS — the owner's credit account, a member's own weekly cap, admin grants
// Entities of the credits slice. Lots and the ledger are children of the
// account and are never targeted directly: a read or write on them is proven
// on the account first. A plain member holds only `read_own_allowance` of the
// organization's credits, through the baseline.
const creditsPermissions = definePermissions([
  {
    // A person sees and manages their own credits.
    name: "manage_own_credits",
    entity: "credit_account",
    actions: ["read", "update"],
    rules: [
      {
        context: [],
        target: [{ field: "credit_account.userId", has: { bag: "$session.user.id" } }],
      },
    ],
  },
  {
    // A member sees their own cap in the active organization — the only piece
    // of the organization's credits a member ever sees.
    name: "read_own_allowance",
    entity: "member_allowance",
    actions: ["read"],
    rules: [
      {
        context: [],
        target: [
          { field: "member_allowance.userId", has: { bag: "$session.user.id" } },
          { field: "member_allowance.organizationId", has: { bag: "$session.organization.id" } },
        ],
      },
    ],
  },
  {
    // The company's credits: the balance, the lots, the ledger, the members' caps.
    name: "manage_credits_company",
    entity: "credit_account",
    actions: ["read", "update"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [{ field: "credit_account.organizationId", has: { bag: "$session.organization.id" } }],
      },
    ],
  },
  {
    // A musical project's credits and its members' allocations.
    name: "manage_credits_musical_project",
    entity: "credit_account",
    actions: ["read", "update"],
    rules: [
      {
        context: [IN_MUSICAL_PROJECT],
        target: [{ field: "credit_account.organizationId", has: { bag: "$session.organization.id" } }],
      },
    ],
  },
  {
    // A member's allocation may create its credits on the active organization
    // rather than draw on what it holds. Without this the organization's
    // credits are bought. Musical projects create theirs; companies buy.
    name: "create_credits_musical_project",
    entity: "member_allowance",
    actions: ["create"],
    rules: [{ context: [IN_MUSICAL_PROJECT], target: [] }],
  },
  {
    // A platform owner gives anyone platform credits without payment (an
    // admin grant); holding it also reads the grants made so far.
    name: "grant_credits_platform",
    entity: "credit_lot",
    actions: ["create"],
    rules: [{ context: [IN_PLATFORM_ADMIN], target: [] }],
  },
]);

// ── PAYMENT — the owner's account, a vendor's products
// Entities of the payment slice. The payment ledger and purchases are children
// of the account and are never targeted directly: a read or write on them is
// proven on the account first. Billing custody is a role (company_billing, below).
const paymentPermissions = definePermissions([
  {
    // A person manages their own payment account (plan, bundles, portal).
    name: "manage_own_billing",
    entity: "payment_account",
    actions: ["read", "update"],
    rules: [
      {
        context: [],
        target: [{ field: "payment_account.userId", has: { bag: "$session.user.id" } }],
      },
    ],
  },
  {
    // The company's money: plan, bundles, payments, purchases, selling.
    name: "manage_billing_company",
    entity: "payment_account",
    actions: ["read", "update"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [{ field: "payment_account.organizationId", has: { bag: "$session.organization.id" } }],
      },
    ],
  },
  {
    name: "create_product_company",
    entity: "product",
    actions: ["create"],
    rules: [{ context: [IN_COMPANY], target: [] }],
  },
  {
    name: "manage_products_company",
    entity: "product",
    actions: ["read", "update"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [{ field: "product.organizationId", has: { bag: "$session.organization.id" } }],
      },
    ],
  },
]);

// ── FORESTS — one tree per archetype + the account baseline ───────────────────
// Owner roles are branch markers (no own leaves): their capability is exactly
// their children's, plus service-level protections (last-owner, etc.).

export const accountBaseline: RoleNode[] = [
  {
    role: "authenticated",
    permissions: [
      "create_company_organization",
      "create_own_profile",
      "manage_own_profile",
      "create_own_preferences",
      "manage_own_preferences",
      "create_own_contact",
      "manage_own_contacts",
      "record_own_consent",
      "view_own_consent",
      "delete_own_account",
      "manage_own_billing",
      "manage_own_credits",
      "read_own_allowance",
    ],
  },
];

const companyForest: RoleNode[] = [
  {
    role: "company_owner",
    children: [
      {
        role: "company_manager",
        permissions: [
          "update_organization_company",
          "manage_members_company",
          "create_invitation_company",
          "manage_invitations_company",
          "create_lock_company",
          "delete_lock_company",
        ],
        children: [
          {
            role: "company_standard",
            permissions: [
              "read_organization_company",
              "list_members_company",
              "read_meteor_company",
              "create_meteor_company",
              "manage_meteor_company",
              "read_lock_company",
            ],
          },
        ],
      },
      {
        // Manage Billing — a sibling of the manager, so a company can hand its
        // money to someone without handing them the roster. Carries the
        // standard reads too: a billing manager must see the members to cap them.
        role: "company_billing",
        permissions: [
          "read_organization_company",
          "list_members_company",
          "manage_billing_company",
          "manage_credits_company",
          "create_product_company",
          "manage_products_company",
        ],
      },
    ],
  },
];

const musicalProjectForest: RoleNode[] = [
  {
    role: "musical_project_owner",
    permissions: [
      "manage_credits_musical_project",
      "create_credits_musical_project",
      "update_organization_musical_project",
      "manage_members_musical_project",
      "create_invitation_musical_project",
      "manage_invitations_musical_project",
    ],
    children: [
      {
        role: "musical_project_member",
        permissions: [
          "read_organization_musical_project",
          "list_members_musical_project",
        ],
      },
    ],
  },
];

const platformAdminForest: RoleNode[] = [
  {
    role: "platform_owner",
    // admin grants are the owner's own, not a delegated role's (credits slice)
    permissions: [
      "update_organization_platform",
      "grant_credits_platform",
      "read_all_profiles_platform",
      "read_all_organizations_platform",
    ],
    children: [
      {
        role: "manage_platform",
        permissions: [
          "read_organization_platform",
          "manage_members_platform",
          "create_invitation_platform",
          "manage_invitations_platform",
        ],
      },
      {
        role: "manage_companies",
        permissions: [
          "read_company_organizations_platform",
          "read_company_members_platform",
        ],
      },
      {
        role: "manage_legal_docs",
        permissions: ["manage_legal_document_platform"],
      },
    ],
  },
];

const systemAdminForest: RoleNode[] = [
  {
    role: "system_admin_owner",
    children: [
      {
        role: "manage_system",
        permissions: [
          "read_organization_system",
          "update_organization_system",
          "manage_members_system",
          "create_invitation_system",
          "manage_invitations_system",
          "create_platform_admin_organization",
          "read_all_locks_system",
          "delete_all_locks_system",
        ],
      },
      {
        role: "view_all_orgs",
        permissions: ["read_all_organizations_system", "read_all_members_system"],
      },
    ],
  },
];

export const forests: Record<string, RoleNode[]> = {
  company: companyForest,
  musical_project: musicalProjectForest,
  platform_admin: platformAdminForest,
  system_admin: systemAdminForest,
};

// ── ASSEMBLY — validators run at load; a bad config fails the import ──────────
// `registerPermissions` → name→permission map; throws on a duplicate name or a
// create action carrying a target. `registerForests` → flat role list; throws on
// a role name reused anywhere in the forest. `tables` is injected by the app
// shell at boot (it owns the drizzle schema).
export const permissions = registerPermissions([
  accountBaselinePermissions,
  companyPermissions,
  musicalProjectPermissions,
  platformAdminPermissions,
  systemAdminPermissions,
  creditsPermissions,
  paymentPermissions,
]);

export const { roles } = registerForests({ accountBaseline, forests });

export const accessControlConfig = { permissions, accountBaseline, forests };

// ── ROLE INHERITANCE — for role-gated UI (nav visibility) ─────────────────────
// The membership roles plus every role they imply in the forests above, read
// the way the engine reads them. Visibility only — the server enforces.
export const rolesImpliedBy = (assigned: readonly string[]): string[] =>
  impliedRoles(assigned, forests);

// ── UI ROLE CATALOG — the membership roles each org UI may assign ─────────────
// Consumed by web-main (`roleCatalog`); the module stays AC-agnostic and renders
// whatever catalog it is handed. Authored as flat data (CFG1) — the owner role
// sorts first, matching the old selector order. Labels/descriptions carried from
// the old role-groups config.
export interface AssignableRole {
  value: string;
  label: string;
  description?: string;
}

export const assignableRolesByOrgType: Record<string, AssignableRole[]> = {
  musical_project: [
    {
      value: "musical_project_owner",
      label: "Owner",
      description:
        "Owns the musical project — manages the org, its members and invitations",
    },
    {
      value: "musical_project_member",
      label: "Member",
      description: "Musical-project member — view the project and its roster",
    },
  ],
  company: [
    {
      value: "company_owner",
      label: "Owner",
      description:
        "Owner marker for the company org — permissions come from implied roles",
    },
    {
      value: "company_manager",
      label: "Manager",
      description: "Manage company team — invite and manage company members",
    },
    {
      value: "company_standard",
      label: "Standard",
      description: "Baseline company member — view own company and roster",
    },
    {
      value: "company_billing",
      label: "Manage Billing",
      description: "Manage company billing — plan, credits, allowances, purchases and selling",
    },
  ],
  platform_admin: [
    {
      value: "platform_owner",
      label: "Owner",
      description:
        "Owner marker for the platform admin org — permissions come from implied roles",
    },
    {
      value: "manage_platform",
      label: "Manage Platform",
      description:
        "Manage platform admin org team — manage platform admin members",
    },
    {
      value: "manage_companies",
      label: "Manage Companies",
      description: "View every company organization and its members",
    },
    {
      value: "manage_legal_docs",
      label: "Manage Legal Docs",
      description: "Create and update legal documents for the platform",
    },
  ],
  system_admin: [
    {
      value: "system_admin_owner",
      label: "Owner",
      description:
        "Owner marker for the system admin org — permissions come from implied roles",
    },
    {
      value: "manage_system",
      label: "Manage System",
      description:
        "Grouping role — implies all system admin management capabilities",
    },
    {
      value: "view_all_orgs",
      label: "View All Orgs",
      description:
        "Grouping role — implies break-glass read visibility across all orgs",
    },
  ],
};
