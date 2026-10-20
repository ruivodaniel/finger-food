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

// ── ACCOUNT BASELINE — every authenticated user, any/no active org ───────────
// User-level (no archetype context). Self-scoped by `$session.user.*`. `create`
// actions carry no target (AC33): the service stamps the owning user id, so the
// gate only answers "may this user create one at all". This is where the old
// create-with-target rules (`write_own_consent`, self profile/contact) collapse
// to context-only creates.
const accountBaselinePermissions = definePermissions([
  {
    // A user founds an org. Which org types are creatable (UOM17) stays a
    // service business rule, not AC.
    name: "create_organization",
    entity: "organization",
    actions: ["create"],
    rules: [{ context: [], target: [] }],
  },
  {
    // Accept/read an invitation addressed to my own email OR phone. Two rules =
    // OR at the engine (email-match rule ∪ phone-match rule).
    name: "accept_own_invitation",
    entity: "invitation",
    actions: ["read", "update"],
    rules: [
      {
        context: [],
        target: [
          { field: "invitation.email", has: { bag: "$session.user.email" } },
        ],
      },
      {
        context: [],
        target: [
          { field: "invitation.phone", has: { bag: "$session.user.phone" } },
        ],
      },
    ],
  },
  {
    name: "create_own_profile",
    entity: "user_profile",
    actions: ["create"],
    rules: [{ context: [], target: [] }],
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
    // service stamps the caller's own id on create; read/update are own-row.
    name: "create_own_preferences",
    entity: "user_preferences",
    actions: ["create"],
    rules: [{ context: [], target: [] }],
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
    name: "create_own_contact",
    entity: "user_contact",
    actions: ["create"],
    rules: [{ context: [], target: [] }],
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
    rules: [{ context: [], target: [] }],
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
]);

// ── FORESTS — one tree per archetype + the account baseline ───────────────────
// Owner roles are branch markers (no own leaves): their capability is exactly
// their children's, plus service-level protections (last-owner, etc.).

export const accountBaseline: RoleNode[] = [
  {
    role: "authenticated",
    permissions: [
      "create_organization",
      "accept_own_invitation",
      "create_own_profile",
      "manage_own_profile",
      "create_own_preferences",
      "manage_own_preferences",
      "create_own_contact",
      "manage_own_contacts",
      "record_own_consent",
      "view_own_consent",
      "delete_own_account",
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
        ],
        children: [
          {
            role: "company_standard",
            permissions: ["read_organization_company", "list_members_company"],
          },
        ],
      },
    ],
  },
];

const musicalProjectForest: RoleNode[] = [
  {
    role: "musical_project_owner",
    permissions: [
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
    permissions: ["update_organization_platform"],
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
