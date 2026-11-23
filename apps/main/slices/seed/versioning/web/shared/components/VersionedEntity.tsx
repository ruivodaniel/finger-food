// One versioned entity at a view: fetches its history and the version on show, and draws that version (what the host renders
// for its row, what it changed) above the timeline, where a version can be released, restored or compared with any other. Another slice reaches versioning through this: its hooks and
// services stay inside. The host owns the view and renders the row.
import { useState, type ReactNode } from "react";
import { Separator } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { VersionView } from "../../../shared/types";
import { useVersioned, viewOf, type ComparedVersionIds } from "../hooks/use-versioned";
import { History } from "./History";
import type { VersionComparison, View } from "./types";
import { VersionBadge } from "./VersionBadge";
import { VersionChanges } from "./VersionChanges";
import { VersionComparePicker } from "./VersionComparePicker";

/** A refused restore in words: a 409 means the branch moved on since the history was read. */
function messageOf(error: Error): string {
  const refused = "status" in error && error.status === 409;
  return refused ? "The branch changed since this was read. The history is up to date now: restore again if you still want this version." : error.message;
}

interface VersionedEntityProps {
  entity: string;
  entityId: string;
  view: View;
  onViewChange: (next: View) => void;
  /** After a restore made a new version: what else shows the entity reads it again. */
  onRestored?: () => void;
  /** A new branch was opened from a version. Without it, versions offer no branching: a host has to be able to edit one. */
  onBranchOpened?: (branch: string) => void;
  /** Comparing started or stopped: a host may want more room for it. */
  onComparingChange?: (comparing: boolean) => void;
  /** While comparing, the row is the later version's, and the comparison says the rest: the host draws what changed (VersionChanges,
   * or its own list), since only it can tell what a change means. */
  children: (row: Record<string, unknown>, comparison?: VersionComparison) => ReactNode;
}

export function VersionedEntity({ entity, entityId, view, onViewChange, onRestored, onBranchOpened, onComparingChange, children }: VersionedEntityProps) {
  const [comparing, setComparing] = useState<ComparedVersionIds | null>(null);
  const { history, versionAt, comparison, fromRead, toRead, restore, release, branch } = useVersioned(entity, entityId, view, comparing);
  const failure = history.error ?? versionAt.error ?? comparison.error ?? fromRead.error ?? toRead.error;
  if (failure) return <span element="type--body-small" status="error">{failure.message}</span>;
  if (!history.data || !versionAt.data) return <span element="type--body-small" emphasis="quiet">Loading…</span>;
  const { version, row } = versionAt.data;
  const versions = history.data.versions;
  const changeComparing = (next: ComparedVersionIds | null) => {
    setComparing(next);
    onComparingChange?.(next !== null);
  };
  /** Whichever way round they were picked, the older one is From: the history lists them in the order they were made. */
  const compareVersions = (firstId: string, secondId: string) => {
    const positionOf = (versionId: string) => versions.findIndex((candidate) => candidate.versionId === versionId);
    changeComparing(positionOf(firstId) <= positionOf(secondId) ? { fromVersionId: firstId, toVersionId: secondId } : { fromVersionId: secondId, toVersionId: firstId });
  };
  const selectVersion = (selected: VersionView) => {
    changeComparing(null);
    onViewChange(viewOf(selected));
  };
  const releaseVersion = (released: VersionView, title: string, description: string) => release.mutate({ versionId: released.versionId, title: title || undefined, description: description || undefined });
  const branchFromVersion = (version: VersionView, name: string) => branch.mutate({ version, name }, { onSuccess: () => onBranchOpened?.(name) });
  const restoreVersion = (restored: VersionView) => restore.mutate(restored, {
    onSuccess: () => {
      onRestored?.();
      changeComparing(null);
      // the restored version is the branch's new head, so the view moves to it
      onViewChange({ branch: view.branch });
    },
  });
  return (
    <Stack dir="col" scale="lg" data-testid="versioned-entity">
      {comparing ? (
        <Stack dir="col" scale="md" align="start">
          <VersionComparePicker versions={versions} fromVersionId={comparing.fromVersionId} toVersionId={comparing.toVersionId} onChange={compareVersions} onStop={() => changeComparing(null)} />
          {comparison.data && fromRead.data && toRead.data ? (
            <>
              {comparison.data.changes.length === 0 ? <span element="type--body-small" emphasis="quiet" data-testid="version-comparison-same">These two versions have the same content.</span> : null}
              {children(toRead.data.row, { ...comparing, fromRow: fromRead.data.row, changes: comparison.data.changes })}
            </>
          ) : <span element="type--body-small" emphasis="quiet">Loading…</span>}
        </Stack>
      ) : (
        <Stack dir="col" scale="md" align="start">
          <VersionBadge version={version} />
          {children(row)}
          <VersionChanges entity={entity} changes={version.changes} />
        </Stack>
      )}
      {release.error ? <span element="type--body-small" status="error" data-testid="version-release-error">{release.error.message}</span> : null}
      {branch.error ? <span element="type--body-small" status="error" data-testid="version-branch-error">{branch.error.message}</span> : null}
      {restore.error ? <span element="type--body-small" status="error" data-testid="version-restore-error">{messageOf(restore.error)}</span> : null}
      <Separator />
      <History entity={entity} history={history.data} selectedVersionId={comparing?.toVersionId ?? version.versionId} onSelect={selectVersion} onRestore={restoreVersion} restoring={restore.isPending} onCompare={(compared) => compareVersions(compared.sources[0]!, compared.versionId)} onRelease={releaseVersion} releasing={release.isPending} onBranch={onBranchOpened ? branchFromVersion : undefined} branching={branch.isPending} />
    </Stack>
  );
}
