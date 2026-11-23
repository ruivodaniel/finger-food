// One branch into another: reads what a merge needs, its two heads and the version they parted from, and makes the merge version,
// whose sources are both heads, from what the host decided. The from branch keeps its head. The host draws the choice.
import { useEffect, type ReactNode } from "react";
import { useBranchMerge } from "../hooks/use-versioned";

/** What a host decides a merge from. */
export interface VersionMergeInputs {
  intoRow: Record<string, unknown>;
  fromRow: Record<string, unknown>;
  baseRow: Record<string, unknown>;
  /** The merge version, with the row's values the host chose. Settles when it is written, and throws when it is refused. */
  merge: (data: Record<string, unknown>) => Promise<void>;
  merging: boolean;
}

interface VersionMergeProps {
  entity: string;
  entityId: string;
  fromBranch: string;
  intoBranch: string;
  onMerged?: () => void;
  /** One of the two branches isn't this entity's, or is archived: nothing to merge here. */
  onMissingBranch?: (branch: string) => void;
  children: (inputs: VersionMergeInputs) => ReactNode;
}

/** A refused merge in words: a 409 means the branch moved on since this was read. */
function messageOf(error: Error): string {
  return "status" in error && error.status === 409 ? "The branch changed since this was read. It is up to date now: check the choices and merge again." : error.message;
}

export function VersionMerge({ entity, entityId, fromBranch, intoBranch, onMerged, onMissingBranch, children }: VersionMergeProps) {
  const { history, into, from, base, merge, missingBranch } = useBranchMerge(entity, entityId, fromBranch, intoBranch);
  useEffect(() => { if (missingBranch) onMissingBranch?.(missingBranch); }, [missingBranch, onMissingBranch]);
  const failure = history.error ?? into.error ?? from.error ?? base.error;
  if (missingBranch) return <span element="type--body-small" emphasis="quiet" data-testid="version-merge-missing">This has no open branch {missingBranch}.</span>;
  if (failure) return <span element="type--body-small" status="error">{failure.message}</span>;
  if (!into.data || !from.data || !base.data) return <span element="type--body-small" emphasis="quiet">Loading…</span>;
  const intoHead = into.data.version.versionId, fromHead = from.data.version.versionId;
  return (
    <>
      {merge.error ? <span element="type--body-small" status="error" data-testid="version-merge-error">{messageOf(merge.error)}</span> : null}
      {children({
        intoRow: into.data.row,
        fromRow: from.data.row,
        baseRow: base.data.row,
        merging: merge.isPending,
        merge: async (data) => {
          await merge.mutateAsync({ sources: [intoHead, fromHead], toBranch: intoBranch, data, expectedHead: intoHead, intent: { what: `Merged ${fromBranch} into ${intoBranch}` } });
          onMerged?.();
        },
      })}
    </>
  );
}
