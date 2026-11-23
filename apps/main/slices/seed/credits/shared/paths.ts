/** The slice's web paths, declared once. */
export const creditsPaths = {
  personalCredits: "/my/settings/credits",
  organizationCredits: (organizationId: string) => `/organizations/${organizationId}/credits`,
  creditGrants: "/manage-credits",
} as const;
