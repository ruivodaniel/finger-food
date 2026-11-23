/**
 * Org-section URL builder. One rule: the active org is spelled `current`,
 * every other member org by its id — so links to "your" org stay stable
 * across activation changes while visited orgs get canonical id URLs.
 */

export type OrgSection = "info" | "members";

export function orgSectionPath(
  base: string,
  orgId: string,
  activeOrgId: string | null,
  section: OrgSection,
): string {
  const segment = orgId === activeOrgId ? "current" : orgId;
  return `${base}/${segment}/${section}`;
}
