// Help Catalog — content for the in-app HelpWidget.
//
// Each entry declares the i18n keys for its title, description, and
// steps (resolved by the module's `t` function at render time). The
// `requires` keys gate visibility against each membership's effective
// roles; `orgTypes` narrows the recipe to specific org types when a
// permission means different things across them.

export const HELP_CATALOG = [
  // ────────────────────────────────────────────────────────────────────
  // MEMBER MANAGEMENT
  // ────────────────────────────────────────────────────────────────────
  {
    id: "invite-platform-admin",
    titleKey: "help.recipes.invite-platform-admin.title",
    descriptionKey: "help.recipes.invite-platform-admin.description",
    stepKeys: [
      "help.recipes.invite-platform-admin.step1",
      "help.recipes.invite-platform-admin.step2",
      "help.recipes.invite-platform-admin.step3",
    ],
    requires: ["invitation.create"],
    orgTypes: ["platform_admin"],
    deepLink: { to: "/organizations/$organizationId/members" },
  },
  {
    id: "edit-member-roles",
    titleKey: "help.recipes.edit-member-roles.title",
    descriptionKey: "help.recipes.edit-member-roles.description",
    stepKeys: [
      "help.recipes.edit-member-roles.step1",
      "help.recipes.edit-member-roles.step2",
      "help.recipes.edit-member-roles.step3",
    ],
    requires: ["member.update"],
    deepLink: { to: "/organizations/$organizationId/members" },
  },
  {
    id: "remove-member",
    titleKey: "help.recipes.remove-member.title",
    descriptionKey: "help.recipes.remove-member.description",
    stepKeys: [
      "help.recipes.remove-member.step1",
      "help.recipes.remove-member.step2",
      "help.recipes.remove-member.step3",
    ],
    requires: ["member.delete"],
    deepLink: { to: "/organizations/$organizationId/members" },
  },

  // ────────────────────────────────────────────────────────────────────
  // ORGANIZATION MANAGEMENT
  // ────────────────────────────────────────────────────────────────────
  {
    id: "create-organization",
    titleKey: "help.recipes.create-organization.title",
    descriptionKey: "help.recipes.create-organization.description",
    stepKeys: [
      "help.recipes.create-organization.step1",
      "help.recipes.create-organization.step2",
      "help.recipes.create-organization.step3",
    ],
    requires: ["organization.create"],
    deepLink: { to: "/organizations" },
  },
  {
    id: "edit-organization",
    titleKey: "help.recipes.edit-organization.title",
    descriptionKey: "help.recipes.edit-organization.description",
    stepKeys: [
      "help.recipes.edit-organization.step1",
      "help.recipes.edit-organization.step2",
      "help.recipes.edit-organization.step3",
    ],
    requires: ["organization.update"],
    deepLink: { to: "/organizations/$organizationId/info" },
  },
  {
    id: "delete-organization",
    titleKey: "help.recipes.delete-organization.title",
    descriptionKey: "help.recipes.delete-organization.description",
    stepKeys: [
      "help.recipes.delete-organization.step1",
      "help.recipes.delete-organization.step2",
      "help.recipes.delete-organization.step3",
    ],
    requires: ["organization.delete"],
    deepLink: { to: "/organizations/$organizationId/info" },
  },

  // ────────────────────────────────────────────────────────────────────
  // LEGAL & COMPLIANCE
  // ────────────────────────────────────────────────────────────────────
  {
    id: "manage-legal-documents",
    titleKey: "help.recipes.manage-legal-documents.title",
    descriptionKey: "help.recipes.manage-legal-documents.description",
    stepKeys: [
      "help.recipes.manage-legal-documents.step1",
      "help.recipes.manage-legal-documents.step2",
      "help.recipes.manage-legal-documents.step3",
    ],
    requires: ["legal_document.create"],
    deepLink: { to: "/manage-legal-documents" },
  },
];
