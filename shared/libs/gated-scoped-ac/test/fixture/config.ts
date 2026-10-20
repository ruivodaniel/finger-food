// AC config fixture — ported from `theo/ac-config.ts`, with subject references
// rewritten to NESTED dotted paths (D3): `$session.user.id` instead of the flat
// `{ bag: "userId" }`. Everything else is faithful. `user` (not app_user).
//
// Subject path map (flat theo → nested D3):
//   userId         → $session.user.id
//   email          → $session.user.email
//   activeOrg      → $session.organization.id
//   activeOrgType  → $session.organization.type

import {
  definePermissions,
  registerForests,
  registerPermissions,
  type RoleNode,
} from "../../src/index";

// ── shared context scopes ──
const IN_COMPANY = {
  bag: "$session.organization.type",
  has: { value: "company" },
} as const;
const IN_SYSTEM_ADMIN = {
  bag: "$session.organization.type",
  has: { value: "system_admin" },
} as const;

// ── ACCOUNT BASELINE (every user, any org type) ──
const accountBaselinePermissions = definePermissions([
  {
    name: "view_own_profile",
    entity: "user",
    actions: ["read"],
    rules: [
      { context: [], target: [{ field: "user.id", has: { bag: "$session.user.id" } }] },
    ],
  },
  {
    name: "edit_own_profile",
    entity: "user",
    actions: ["update"],
    rules: [
      { context: [], target: [{ field: "user.id", has: { bag: "$session.user.id" } }] },
    ],
  },
  {
    name: "view_public_notes",
    entity: "note_share",
    actions: ["read"],
    rules: [
      {
        context: [],
        target: [{ field: "note_share.kind", has: { value: "public" } }],
      },
    ],
  },
]);

// ── COMPANY org type ──
const companyPermissions = definePermissions([
  {
    name: "manage_own_notes",
    entity: "note",
    actions: ["read", "update", "delete"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [{ field: "note.authorUserId", has: { bag: "$session.user.id" } }],
      },
    ],
  },
  {
    name: "create_own_notes",
    entity: "note",
    actions: ["create"],
    rules: [{ context: [IN_COMPANY], target: [] }],
  },
  {
    name: "view_user_shared_notes",
    entity: "note_share",
    actions: ["read"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          { field: "note_share.kind", has: { value: "user" } },
          { field: "note_share.userId", has: { bag: "$session.user.id" } },
        ],
      },
    ],
  },
  {
    name: "view_email_shared_notes",
    entity: "note_share",
    actions: ["read"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          { field: "note_share.kind", has: { value: "email" } },
          { field: "note_share.email", has: { bag: "$session.user.email" } },
        ],
      },
    ],
  },
  {
    name: "view_org_shared_notes",
    entity: "note_share",
    actions: ["read"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          { field: "note_share.kind", has: { value: "org" } },
          {
            field: "note_share.organizationId",
            has: { bag: "$session.organization.id" },
          },
        ],
      },
    ],
  },
  {
    name: "create_own_shares",
    entity: "note_share",
    actions: ["create"],
    rules: [{ context: [IN_COMPANY], target: [] }],
  },
  {
    name: "delete_own_shares",
    entity: "note_share",
    actions: ["delete"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          {
            field: "note_share.sharedByUserId",
            has: { bag: "$session.user.id" },
          },
        ],
      },
    ],
  },
  {
    name: "view_org_employees",
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
    name: "manage_org_employees",
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
  // VIEW example — `note_with_author` is a VIEW, sitting in the tables map like
  // any other entity. Nothing here says "view": same DSL, same resolver, and a
  // field list projects its columns exactly as it does on a table.
  {
    name: "view_own_notes_with_author",
    entity: "note_with_author",
    actions: ["read"],
    fields: ["id", "title", "authorEmail"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          {
            field: "note_with_author.authorUserId",
            has: { bag: "$session.user.id" },
          },
        ],
      },
    ],
  },
  // JOIN example (pilot addition) — any note whose org is a company
  // (note.organizationId → organization.type). Held by `company_auditor`.
  {
    name: "audit_company_notes",
    entity: "note",
    actions: ["read"],
    rules: [
      {
        context: [IN_COMPANY],
        target: [
          {
            field: "note.organizationId",
            join: "organization",
            where: { field: "organization.type", has: { value: "company" } },
          },
        ],
      },
    ],
  },
]);

// ── SYSTEM_ADMIN org type ──
const systemAdminPermissions = definePermissions([
  {
    name: "view_all_notes",
    entity: "note",
    actions: ["read"],
    rules: [{ context: [IN_SYSTEM_ADMIN], target: [] }],
  },
]);

// ── Forests (one per org type) + the org-type-agnostic baseline ──
export const accountBaseline: RoleNode[] = [
  {
    role: "default",
    permissions: ["view_own_profile", "edit_own_profile", "view_public_notes"],
  },
];

const companyForest: RoleNode[] = [
  {
    role: "admin",
    permissions: ["manage_org_employees"],
    children: [
      {
        role: "manager",
        permissions: ["view_org_employees"],
        children: [
          {
            role: "employee",
            permissions: [
              "manage_own_notes",
              "create_own_notes",
              "view_user_shared_notes",
              "view_email_shared_notes",
              "view_org_shared_notes",
              "create_own_shares",
              "delete_own_shares",
              "view_own_notes_with_author",
            ],
          },
        ],
      },
    ],
  },
  // separate top-level role (NOT under admin) — demonstrates the traversal perm.
  { role: "company_auditor", permissions: ["audit_company_notes"] },
];

const systemAdminForest: RoleNode[] = [
  { role: "sys_admin", permissions: ["view_all_notes"] },
];

export const forests: Record<string, RoleNode[]> = {
  company: companyForest,
  system_admin: systemAdminForest,
};

export const allPermissions = registerPermissions([
  accountBaselinePermissions,
  companyPermissions,
  systemAdminPermissions,
]);

// role names must be globally unique across baseline + all forests (throws on dup)
registerForests({ accountBaseline, forests });
