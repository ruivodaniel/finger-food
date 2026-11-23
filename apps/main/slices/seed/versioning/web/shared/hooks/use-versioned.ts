// The history of an entity, the version a view sees, what a version changed from its source, and restoring and releasing a
// version, through the query cache.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { findCommonAncestor } from "../../../shared/common-ancestor";
import type { MergeVersionsInput, ReleaseVersionInput, VersionView } from "../../../shared/types";
import { versioningService } from "../../services/application/versioning.service";
import type { View } from "../components/types";

/** The view that shows a version: a head is its branch now, an older version is also a moment. */
export function viewOf(version: VersionView): View {
  const branch = version.branch === "main" ? undefined : version.branch;
  return version.isHead ? { branch } : { branch, at: version.at };
}

export interface ComparedVersionIds {
  fromVersionId: string;
  toVersionId: string;
}

export function useVersioned(entity: string, entityId: string, view: View, comparing: ComparedVersionIds | null) {
  const queryClient = useQueryClient();
  const entityKey = versioningService.keys.entity(entity, entityId);
  // what is on show is read when it mounts: the entity may have changed elsewhere since
  const history = useQuery({ ...versioningService.getHistory(entity, entityId), refetchOnMount: "always" });
  const versionAt = useQuery({ ...versioningService.getVersionAt(entity, entityId, view), refetchOnMount: "always" });
  const versionOf = (versionId: string | undefined) => history.data?.versions.find((version) => version.versionId === versionId);
  const fromVersion = versionOf(comparing?.fromVersionId), toVersion = versionOf(comparing?.toVersionId);
  const comparison = useQuery(versioningService.getComparison(entity, entityId, comparing));
  const fromRead = useQuery(versioningService.getVersion(entity, entityId, fromVersion?.versionId));
  const toRead = useQuery(versioningService.getVersion(entity, entityId, toVersion?.versionId));
  const refresh = () => queryClient.invalidateQueries({ queryKey: entityKey });
  const restore = useMutation({
    /** A clone onto the version's own branch, refused when its head moved since the history was read. */
    mutationFn: (version: VersionView) =>
      versioningService.cloneVersion(entity, entityId, {
        from: version.versionId,
        toBranch: version.branch,
        expectedHead: history.data?.branches.find((branch) => branch.name === version.branch)?.headVersionId ?? undefined,
        intent: { what: `Restored ${version.label}` },
      }),
    // a refused restore read a head that moved: read again, so that the next try sends the new one
    onSettled: refresh,
  });
  const release = useMutation({
    mutationFn: (input: ReleaseVersionInput) => versioningService.release(entity, entityId, input),
    onSettled: refresh,
  });
  const branch = useMutation({
    /** A new branch from a version: a clone onto a name it doesn't have yet. */
    mutationFn: ({ version, name }: { version: VersionView; name: string }) =>
      versioningService.cloneVersion(entity, entityId, { from: version.versionId, toBranch: name, intent: { what: `Branched from ${version.label}` } }),
    onSettled: refresh,
  });
  return { history, versionAt, comparison, fromRead, toRead, refresh, restore, release, branch };
}

/** What merging one branch into another reads and writes: the two heads, the version they parted from, and the merge. */
export function useBranchMerge(entity: string, entityId: string, fromBranch: string, intoBranch: string) {
  const queryClient = useQueryClient();
  const entityKey = versioningService.keys.entity(entity, entityId);
  // the heads decide everything here: only a history read now will do
  const history = useQuery({ ...versioningService.getHistory(entity, entityId), refetchOnMount: "always" });
  const versions = history.isFetchedAfterMount && !history.isFetching ? history.data?.versions ?? [] : [];
  const headOf = (name: string) => versions.find((version) => version.branch === name && version.isHead);
  const intoHead = headOf(intoBranch), fromHead = headOf(fromBranch);
  const openBranches = new Set((history.data?.branches ?? []).filter((branch) => !branch.archivedAt).map((branch) => branch.name));
  const missingBranch = versions.length === 0 ? null : [intoBranch, fromBranch].find((name) => !openBranches.has(name)) ?? null;
  const baseId = intoHead && fromHead ? findCommonAncestor(versions, intoHead.versionId, fromHead.versionId) : null;
  const into = useQuery(versioningService.getVersion(entity, entityId, intoHead?.versionId));
  const from = useQuery(versioningService.getVersion(entity, entityId, fromHead?.versionId));
  const base = useQuery(versioningService.getVersion(entity, entityId, baseId));
  const merge = useMutation({
    mutationFn: (input: MergeVersionsInput) => versioningService.merge(entity, entityId, input),
    // a refused merge read a head that moved: read again, so that the next try sends the new one
    onSettled: () => queryClient.invalidateQueries({ queryKey: entityKey }),
  });
  return { history, into, from, base, merge, missingBranch };
}
