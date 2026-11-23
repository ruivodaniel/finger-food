/**
 * Resolve role ids to their configured display labels, from the same catalog
 * the invite selector reads. Pass the org type to scope the lookup to that
 * type (how the selector resolves); omit it only where the caller genuinely
 * has no org type (a user's own pending invitations), which falls back to a
 * flat search across the catalog. Unknown ids fall back to the raw id.
 */

type RoleCatalog = Record<string, Array<{ value: string; label: string }>>;

export function roleLabels(catalog: RoleCatalog | undefined, orgType?: string): (roles: string[]) => string {
  const scoped = orgType ? catalog?.[orgType] : undefined;
  const labels = new Map<string, string>();
  for (const role of scoped ?? Object.values(catalog ?? {}).flat()) {
    labels.set(role.value, role.label);
  }
  return (roles: string[]) => roles.map((role) => labels.get(role) ?? role).join(", ");
}
