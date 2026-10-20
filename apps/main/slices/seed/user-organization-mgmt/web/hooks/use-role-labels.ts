/**
 * useRoleLabels — resolve role ids to their configured display labels, the
 * same catalog the invite selector reads. Pass the org type to scope the
 * lookup to that type (how the selector resolves); omit it only where the
 * caller genuinely has no org type (a user's own pending invitations), which
 * falls back to a flat search across the catalog. Unknown ids fall back to
 * the raw id.
 */

import * as React from "react";
import { useUserOrgMgmtContext } from "../providers/UserOrgMgmtProvider";

export function useRoleLabels(
  orgType?: string,
): (roles: string[]) => string {
  const { config } = useUserOrgMgmtContext();
  return React.useMemo(() => {
    const catalog = config.roleCatalog ?? {};
    const scoped = orgType ? catalog[orgType] : undefined;
    const labels = new Map<string, string>();
    for (const role of scoped ?? Object.values(catalog).flat()) {
      labels.set(role.value, role.label);
    }
    return (roles: string[]) =>
      roles.map((role) => labels.get(role) ?? role).join(", ");
  }, [config.roleCatalog, orgType]);
}
