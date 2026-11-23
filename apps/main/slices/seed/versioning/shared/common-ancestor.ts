// The newest version two versions both descend from, following their sources: a merge's base. A merge counts as descending from
// every source, so a branch merged once is compared from that merge on.
interface VersionInHistory {
  versionId: string;
  sources: string[];
}

function withAncestors(versions: VersionInHistory[], versionId: string): Set<string> {
  const byId = new Map(versions.map((version) => [version.versionId, version]));
  const found = new Set<string>();
  const toVisit = [versionId];
  while (toVisit.length > 0) {
    const current = toVisit.pop()!;
    if (found.has(current)) continue;
    found.add(current);
    toVisit.push(...(byId.get(current)?.sources ?? []));
  }
  return found;
}

/** `versions` in the order they were made, as a history lists them. Nothing when they share no version. */
export function findCommonAncestor(versions: VersionInHistory[], firstId: string, secondId: string): string | null {
  const ofFirst = withAncestors(versions, firstId), ofSecond = withAncestors(versions, secondId);
  // the latest one both have: the last in the list
  return [...versions].reverse().find((version) => ofFirst.has(version.versionId) && ofSecond.has(version.versionId))?.versionId ?? null;
}
