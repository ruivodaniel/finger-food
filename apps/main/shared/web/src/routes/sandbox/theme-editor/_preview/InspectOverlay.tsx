import { type RefObject } from "react";
import { createPortal } from "react-dom";
import type {
  ChainSegment,
  ThemeRule,
} from "../../../../../../../../../shared/libs/ui/types";
import type { NavSelection } from "../_core/types";
import type { ChainRow } from "./inspectChain";
import { matchRulesAgainstChain, chainsEqual } from "./inspectMatch";
import { usePopoverPlacement } from "../_editors/shared/usePopoverPlacement";

type Props = {
  /** Chain under the cursor — drives the highlight box (live preview). */
  hoveredChain: ChainRow[];
  /** Chain locked by the last click — drives the popover. */
  lockedChain: ChainRow[];
  containerRef: RefObject<HTMLDivElement | null>;
  popoverRef: RefObject<HTMLDivElement | null>;
  rules: readonly ThemeRule[];
  /** Open a navigator entity (entity, family, layout). */
  onOpenEntity: (sel: NavSelection) => void;
  /** Open an existing rule by its index. */
  onOpenRule: (index: number) => void;
  /** Create a new rule with a pre-filled chain. */
  onCreateRuleWithChain: (chain: readonly ChainSegment[]) => void;
};

/**
 * Inspect overlay.
 *
 * Two independent surfaces driven by separate chains:
 *   - HIGHLIGHT box: anchored to `hoveredChain[0]` — follows the cursor as
 *     the user moves over preview elements.
 *   - POPOVER: anchored to `lockedChain[0]` (the leaf the user CLICKED).
 *     Stable; doesn't chase the cursor. User can move the mouse into the
 *     popover to interact with action buttons. Click another preview
 *     element to re-lock to it.
 *
 * Position uses `usePopoverPlacement` (same as TokenPicker etc.) — portaled,
 * auto-flipping, viewport-clamped.
 */
export function InspectOverlay({
  hoveredChain,
  lockedChain,
  containerRef,
  popoverRef,
  rules,
  onOpenEntity,
  onOpenRule,
  onCreateRuleWithChain,
}: Props) {
  const hoveredLeaf = hoveredChain[0]?.node ?? null;
  const lockedLeaf = lockedChain[0]?.node ?? null;

  // Hook must run unconditionally — pass null when nothing is locked yet.
  const { style: popoverStyle } = usePopoverPlacement(
    lockedLeaf,
    !!lockedLeaf,
    {
      width: 360,
      maxHeight: 480,
      gap: 8,
      align: "left",
    },
  );

  const container = containerRef.current;

  return (
    <>
      {/* Highlight on the currently-hovered node — moves with the cursor */}
      {hoveredLeaf && container && (
        <Highlight node={hoveredLeaf} container={container} />
      )}

      {/* Popover — only after a click locks it; portaled, anchored, stable */}
      {lockedLeaf &&
        createPortal(
          <div
            ref={popoverRef}
            className="bg-white border border-zinc-200 rounded-lg shadow-xl text-[11px] flex flex-col"
            style={{ ...popoverStyle, zIndex: 9999 }}
          >
            <div className="px-2 py-1 border-b border-zinc-100 text-[9px] uppercase tracking-wider text-zinc-500 flex shrink-0">
              <span className="flex-1">Node</span>
              <span>Actions</span>
            </div>
            <div className="overflow-y-auto">
              <PopoverBody
                chain={lockedChain}
                rules={rules}
                onOpenEntity={onOpenEntity}
                onOpenRule={onOpenRule}
                onCreateRuleWithChain={onCreateRuleWithChain}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Highlight box (separate from popover) ─────────────────────────────────

function Highlight({
  node,
  container,
}: {
  node: HTMLElement;
  container: HTMLDivElement;
}) {
  const containerRect = container.getBoundingClientRect();
  const elRect = node.getBoundingClientRect();
  const x = elRect.x - containerRect.x + container.scrollLeft;
  const y = elRect.y - containerRect.y + container.scrollTop;
  return (
    <div
      className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-10"
      style={{
        left: x,
        top: y,
        width: elRect.width,
        height: elRect.height,
      }}
    />
  );
}

// ── Popover body — chain rows + matched rules ─────────────────────────────

function PopoverBody({
  chain,
  rules,
  onOpenEntity,
  onOpenRule,
  onCreateRuleWithChain,
}: {
  chain: ChainRow[];
  rules: readonly ThemeRule[];
  onOpenEntity: (sel: NavSelection) => void;
  onOpenRule: (index: number) => void;
  onCreateRuleWithChain: (chain: readonly ChainSegment[]) => void;
}) {
  const matches = matchRulesAgainstChain(rules, chain);
  const matchedByRow = new Map<number, number[]>();
  for (const m of matches) {
    const arr = matchedByRow.get(m.endsAtRowIndex) ?? [];
    arr.push(m.ruleIndex);
    matchedByRow.set(m.endsAtRowIndex, arr);
  }

  return (
    <>
      {chain.map((row, i) => (
        <ChainRowGroup
          key={i}
          row={row}
          rowIndex={i}
          chain={chain}
          rules={rules}
          matchedRuleIndices={matchedByRow.get(i) ?? []}
          onOpenEntity={onOpenEntity}
          onOpenRule={onOpenRule}
          onCreateRuleWithChain={onCreateRuleWithChain}
        />
      ))}
    </>
  );
}

// ── One cascade row group: plain row + optional concept row + matched rules ─

function ChainRowGroup({
  row,
  rowIndex,
  chain,
  rules,
  matchedRuleIndices,
  onOpenEntity,
  onOpenRule,
  onCreateRuleWithChain,
}: {
  row: ChainRow;
  rowIndex: number;
  chain: ChainRow[];
  rules: readonly ThemeRule[];
  matchedRuleIndices: number[];
  onOpenEntity: (sel: NavSelection) => void;
  onOpenRule: (index: number) => void;
  onCreateRuleWithChain: (chain: readonly ChainSegment[]) => void;
}) {
  const isLayout = row.kind === "layout";

  const plainPrefill = buildPrefill(chain, rowIndex, /* includeRowConcept */ false);
  const conceptPrefill = row.concept
    ? buildPrefill(chain, rowIndex, /* includeRowConcept */ true)
    : null;

  const plainExistingIdx = findExactRule(rules, plainPrefill);
  const conceptExistingIdx = conceptPrefill
    ? findExactRule(rules, conceptPrefill)
    : null;

  const plainSel = navSelectionFor(row);

  const subRowRuleIndices = matchedRuleIndices.filter(
    (idx) => idx !== plainExistingIdx && idx !== conceptExistingIdx,
  );

  return (
    <>
      <Row
        node={
          <span className="text-zinc-900">
            {row.key}
            {isLayout && <span className="text-zinc-400 ml-1">layout</span>}
          </span>
        }
      >
        <Action
          label="Open"
          onClick={() => plainSel && onOpenEntity(plainSel)}
          disabled={!plainSel}
        />
        {plainExistingIdx != null ? (
          <Action
            label="Open"
            onClick={() => onOpenRule(plainExistingIdx)}
            hint="rule"
          />
        ) : (
          <Action
            label="Rule+"
            onClick={() => onCreateRuleWithChain(plainPrefill)}
          />
        )}
      </Row>

      {row.concept && (
        <Row
          node={
            <span className="text-zinc-900">
              <span className="text-blue-700">{row.concept}</span> {row.key}
            </span>
          }
        >
          {conceptExistingIdx != null ? (
            <Action
              label="Open"
              onClick={() => onOpenRule(conceptExistingIdx)}
              hint="rule"
            />
          ) : (
            <Action
              label="Rule+"
              onClick={() => onCreateRuleWithChain(conceptPrefill!)}
            />
          )}
        </Row>
      )}

      {subRowRuleIndices.map((idx) => (
        <Row
          key={idx}
          node={
            <span className="text-zinc-500 pl-3">
              ↪ {chainText(rules[idx]!)}
            </span>
          }
        >
          <Action label="Open" onClick={() => onOpenRule(idx)} hint="rule" />
        </Row>
      ))}
    </>
  );
}

// ── Atoms ──────────────────────────────────────────────────────────────────

function Row({
  node,
  children,
}: {
  node: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-50 border-b border-zinc-100 last:border-b-0">
      <span className="flex-1 min-w-0 truncate font-mono">{node}</span>
      <span className="flex items-center gap-1 shrink-0">{children}</span>
    </div>
  );
}

function Action({
  label,
  onClick,
  disabled,
  hint,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={hint}
      className="px-1.5 py-0.5 text-[10px] rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-default"
    >
      {label}
    </button>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function navSelectionFor(row: ChainRow): NavSelection | null {
  if (row.kind === "layout")
    return { category: "layouts", path: [row.key] };
  if (row.kind === "family")
    return { category: "families", path: [row.key] };
  if (row.kind === "element")
    return { category: "elements", path: [row.key] };
  return null;
}

function buildPrefill(
  chain: ChainRow[],
  rowIndex: number,
  includeRowConcept: boolean,
): ChainSegment[] {
  const out: ChainSegment[] = [];
  for (let j = chain.length - 1; j >= rowIndex; j--) {
    const r = chain[j]!;
    const seg: ChainSegment = { key: r.key };
    const useConcept = j === rowIndex ? includeRowConcept : true;
    if (useConcept && r.concept) seg.concept = r.concept;
    out.push(seg);
  }
  return out;
}

function findExactRule(
  rules: readonly ThemeRule[],
  chain: readonly ChainSegment[],
): number | null {
  for (let i = 0; i < rules.length; i++) {
    if (chainsEqual(rules[i]!.chain, chain)) return i;
  }
  return null;
}

function chainText(rule: ThemeRule): string {
  return rule.chain
    .map((s) => (s.concept ? `${s.concept} ${s.key}` : s.key))
    .join(" > ");
}
