// The versions as one timeline, newest first, an archived branch's faded. A line at the left draws the branches, and a row says who made the version, when
// and what changed, and can compare it with its source, release it or restore it. Clicking a row asks to show that version. The line is an svg: its positions are its own, the theme has no graph.
import { Badge, Button } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { History as HistoryFeed, VersionView } from "../../../shared/types";
import { formatMoment } from "../helpers/format";
import { BranchFromVersion } from "./BranchFromVersion";
import { presenterOf } from "./presenters";
import { Release } from "./Release";
import { Restore } from "./Restore";

const ROW_HEIGHT = 56;
const LANE_WIDTH = 18;
const LINE_LEFT = 12;
const DOT_RADIUS = 5;

interface HistoryProps {
  entity: string;
  history: HistoryFeed;
  /** The version on show. */
  selectedVersionId: string;
  onSelect: (version: VersionView) => void;
  onRestore: (version: VersionView) => void;
  restoring: boolean;
  /** Asks to compare a version, starting from its source. */
  onCompare: (version: VersionView) => void;
  onRelease: (version: VersionView, title: string, description: string) => void;
  releasing: boolean;
  /** Without it, a version offers no branching: its host has no way to edit one. */
  onBranch?: (version: VersionView, name: string) => void;
  branching?: boolean;
}

export function History({ entity, history, selectedVersionId, onSelect, onRestore, restoring, onCompare, onRelease, releasing, onBranch, branching = false }: HistoryProps) {
  const presenter = presenterOf(entity);
  const labelOfField = (field: string) => presenter.fields?.find((candidate) => candidate.key === field)?.label ?? field;
  const branchNames = history.branches.map((branch) => branch.name);
  const archivedBranches = new Set(history.branches.filter((branch) => branch.archivedAt).map((branch) => branch.name));
  const versions = history.versions.filter((version) => branchNames.includes(version.branch)).sort((first, second) => +new Date(second.at) - +new Date(first.at));
  const lastRelease = history.releases.at(-1);
  const lastReleasedSeq = history.versions.find((version) => version.versionId === lastRelease?.versionId)?.seq ?? -1;
  const changesText = (version: VersionView) => {
    if (!version.changes) return "first version";
    if (version.changes.length === 0) return "no changes";
    return presenter.summarize?.(version.changes) ?? `changed ${version.changes.map((change) => labelOfField(change.field)).join(", ")}`;
  };
  const positionOf = (version: VersionView) => ({
    x: LINE_LEFT + branchNames.indexOf(version.branch) * LANE_WIDTH,
    y: versions.indexOf(version) * ROW_HEIGHT + ROW_HEIGHT / 2,
  });
  const lineWidth = LINE_LEFT * 2 + (branchNames.length - 1) * LANE_WIDTH;
  return (
    <div style={{ position: "relative" }} data-testid="version-history">
      <svg width={lineWidth} height={versions.length * ROW_HEIGHT} aria-hidden style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", zIndex: 1 }}>
        {versions.flatMap((version) => version.sources.map((sourceId) => {
          const source = versions.find((candidate) => candidate.versionId === sourceId);
          if (!source) return null;
          const from = positionOf(source);
          const to = positionOf(version);
          const middleY = (from.y + to.y) / 2;
          return <path key={`${sourceId}-${version.versionId}`} d={`M${from.x},${from.y} C${from.x},${middleY} ${to.x},${middleY} ${to.x},${to.y}`} fill="none" style={{ stroke: "var(--color-gray-300)" }} strokeWidth={1.5} strokeDasharray={version.origin === "branch" ? "4 3" : undefined} />;
        }))}
        {versions.map((version) => {
          const { x, y } = positionOf(version);
          return <circle key={version.versionId} cx={x} cy={y} r={DOT_RADIUS} style={{ fill: version.versionId === selectedVersionId ? "var(--color-brand-1)" : "var(--color-gray-100)", stroke: "var(--color-gray-500)" }} strokeWidth={1.5} />;
        })}
      </svg>
      {versions.map((version) => (
        <div
          key={version.versionId}
          role="button"
          tabIndex={0}
          element="control--list-item"
          state={version.versionId === selectedVersionId ? "selected" : undefined}
          data-testid={`version-${version.label}`}
          onClick={() => onSelect(version)}
          onKeyDown={(event) => { if (event.key === "Enter") onSelect(version); }}
          style={{ opacity: archivedBranches.has(version.branch) ? 0.55 : undefined, cursor: "pointer", height: ROW_HEIGHT, boxSizing: "border-box", paddingLeft: lineWidth + 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
        >
          <Stack dir="col" scale="3xs">
            <Stack dir="row" scale="xs" align="center" wrap>
              <Badge scale="xs" status="neutral" emphasis="secondary">{version.label}</Badge>
              {version.isHead ? <Badge scale="xs" status="neutral">head</Badge> : null}
              {archivedBranches.has(version.branch) ? <Badge scale="xs" status="neutral" emphasis="secondary" data-testid="version-archived">{version.branch} archived</Badge> : null}
              <span element="type--body-small">{version.author.name ?? version.author.id}</span>
              <span element="type--body-extra-small" emphasis="quiet">{formatMoment(version.at)}</span>
            </Stack>
            <span element="type--body-extra-small" emphasis="quiet">
              {version.intent.what ?? changesText(version)}
            </span>
          </Stack>
          {/* the dialogs are React children of this row: without this, their clicks and keys would select the row too */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
            {version.sources.length > 0 ? <Button emphasis="tertiary" scale="sm" onClick={() => onCompare(version)} data-testid="version-compare" aria-label={`Compare ${version.label}`}>Compare</Button> : null}
            {version.branch === "main" && version.seq > lastReleasedSeq ? <Release version={version} number={(lastRelease?.number ?? 0) + 1} disabled={releasing} onRelease={(title, description) => onRelease(version, title, description)} /> : null}
            {onBranch ? <BranchFromVersion version={version} takenNames={history.branches.map((branch) => branch.name)} disabled={branching} onBranch={(name) => onBranch(version, name)} /> : null}
            {version.isHead || archivedBranches.has(version.branch) ? null : <Restore version={version} disabled={restoring} onRestore={() => onRestore(version)} />}
          </div>
        </div>
      ))}
    </div>
  );
}
