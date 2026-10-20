import { useCallback, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useThemeEditor } from "../_core/useThemeEditor";
import type { NavSelection } from "../_core/types";
import type {
  ChainSegment,
  ThemeRule,
} from "../../../../../../../../../shared/libs/ui/types";
import { Navigator } from "../_navigator/Navigator";
import { RuleEditorModal } from "../_navigator/RuleEditorModal";
import { Preview } from "../_preview/Preview";
import { FixtureSelector } from "../_preview/FixtureSelector";
import { FixtureActionsMenu } from "../_preview/FixtureActionsMenu";
import { PropertyPanel } from "../_property-panel/PropertyPanel";
import { InspectOverlay } from "../_preview/InspectOverlay";
import type { ChainRow } from "../_preview/inspectChain";
import { collectThemeChain } from "../_preview/inspectChain";
import { EditorShell } from "../_chrome/EditorShell";

export const Route = createFileRoute(
  "/sandbox/theme-editor/$themeId/$" as never,
)({
  component: ThemeEditorPage,
});

// Lifted from RulesSection — now owned at page level so InspectOverlay can
// also trigger creation/edit of rules.
type RuleModalState =
  | null
  | { mode: "create"; prefill?: ThemeRule }
  | { mode: "edit"; index: number };

function ThemeEditorPage() {
  const { themeId, _splat } = Route.useParams() as {
    themeId: string;
    _splat: string;
  };
  const fixtureId = _splat;
  const navigate = useNavigate();
  const {
    draft,
    onChange,
    isDirty,
    isUrgent,
    isSaving,
    savedAt,
    saveError,
    revert,
    save,
  } = useThemeEditor(themeId);
  const [selection, setSelection] = useState<NavSelection | null>(null);

  const setFixtureId = useCallback(
    (next: string) => {
      navigate({
        to: "/sandbox/theme-editor/$themeId/$" as never,
        params: { themeId, _splat: next } as never,
        replace: true,
      });
    },
    [navigate, themeId],
  );

  // One-shot signal to the navigator: collapse-all + expand the focus path.
  const [focusPulse, setFocusPulse] = useState(0);

  // Inspect mode — two independent chains:
  //   hoveredChain → drives the highlight box, updates on every mousemove
  //   lockedChain  → drives the popover, set on click and stays put
  const [inspectMode, setInspectMode] = useState(false);
  const [hoveredChain, setHoveredChain] = useState<ChainRow[]>([]);
  const [lockedChain, setLockedChain] = useState<ChainRow[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const inspectPopoverRef = useRef<HTMLDivElement>(null);

  // Rule modal — single source of truth (RulesSection + InspectOverlay both
  // request open via callbacks).
  const [ruleModal, setRuleModal] = useState<RuleModalState>(null);

  // ── Inspect handlers ──────────────────────────────────────

  const handleInspectMove = useCallback(
    (e: React.MouseEvent) => {
      if (!inspectMode || !previewRef.current) return;
      const target = e.target as HTMLElement;
      if (inspectPopoverRef.current?.contains(target)) return;
      const chain = collectThemeChain(target, previewRef.current);
      setHoveredChain(chain);
    },
    [inspectMode],
  );

  const focusSelection = useCallback((sel: NavSelection) => {
    setSelection(sel);
    setFocusPulse((n) => n + 1);
  }, []);

  const handleInspectClick = useCallback(
    (e: React.MouseEvent) => {
      if (!inspectMode) return;
      // Clicks inside the inspect popover handle their own actions.
      if (inspectPopoverRef.current?.contains(e.target as HTMLElement)) return;
      e.preventDefault();
      e.stopPropagation();
      // Lock the popover to whatever's currently hovered.
      setLockedChain(hoveredChain);
    },
    [inspectMode, hoveredChain],
  );

  const handleInspectToggle = useCallback(() => {
    setInspectMode((m) => !m);
    if (inspectMode) {
      setHoveredChain([]);
      setLockedChain([]);
    }
  }, [inspectMode]);

  const closeInspect = useCallback(() => {
    setInspectMode(false);
    setHoveredChain([]);
    setLockedChain([]);
  }, []);

  // ── Rule CRUD handlers ────────────────────────────────────

  const openCreateRule = useCallback(
    (prefill?: readonly ChainSegment[]) => {
      closeInspect();
      setRuleModal({
        mode: "create",
        prefill: prefill
          ? {
              chain: prefill as readonly [ChainSegment, ...ChainSegment[]],
              tokens: {},
            }
          : undefined,
      });
    },
    [closeInspect],
  );

  const openEditRule = useCallback((index: number) => {
    setRuleModal({ mode: "edit", index });
  }, []);

  const closeRuleModal = useCallback(() => setRuleModal(null), []);

  const saveRule = useCallback(
    (rule: ThemeRule, index?: number) => {
      const rules = draft.rules ?? [];
      const next = [...rules];
      if (typeof index === "number") next[index] = rule;
      else next.push(rule);
      onChange(["rules"], next);
      setRuleModal(null);

      const newIndex = typeof index === "number" ? index : next.length - 1;
      focusSelection({ category: "rules", path: [String(newIndex)] });
    },
    [draft, onChange, focusSelection],
  );

  const deleteRule = useCallback(
    (index: number) => {
      const rules = draft.rules ?? [];
      const next = rules.filter((_, i) => i !== index);
      onChange(["rules"], next);
      setRuleModal(null);

      if (
        selection?.category === "rules" &&
        selection.path[0] === String(index)
      ) {
        setSelection(null);
      }
    },
    [draft, onChange, selection],
  );

  const openExistingRule = useCallback(
    (index: number) => {
      focusSelection({ category: "rules", path: [String(index)] });
      closeInspect();
    },
    [focusSelection, closeInspect],
  );

  return (
    <>
      <EditorShell
        previewHeader={
          <div className="flex items-center gap-2">
            <FixtureSelector value={fixtureId} onChange={setFixtureId} />
            <FixtureActionsMenu />
          </div>
        }
        isDirty={isDirty}
        isUrgent={isUrgent}
        isSaving={isSaving}
        savedAt={savedAt}
        saveError={saveError}
        onSave={save}
        onRevert={revert}
        inspectMode={inspectMode}
        onInspectToggle={handleInspectToggle}
        previewRef={previewRef}
        onPreviewMouseMove={handleInspectMove}
        onPreviewClick={handleInspectClick}
        navigator={
          <Navigator
            theme={draft}
            selection={selection}
            onSelect={setSelection}
            focusPulse={focusPulse}
            onOpenCreateRule={() => openCreateRule()}
            onOpenEditRule={openEditRule}
          />
        }
        preview={<Preview draft={draft} fixtureId={fixtureId} />}
        inspectOverlay={
          inspectMode ? (
            <InspectOverlay
              hoveredChain={hoveredChain}
              lockedChain={lockedChain}
              containerRef={previewRef}
              popoverRef={inspectPopoverRef}
              rules={draft.rules ?? []}
              onOpenEntity={(sel) => {
                focusSelection(sel);
                closeInspect();
              }}
              onOpenRule={openExistingRule}
              onCreateRuleWithChain={openCreateRule}
            />
          ) : null
        }
        panel={
          <PropertyPanel
            theme={draft}
            selection={selection}
            onChange={onChange}
          />
        }
      />

      {ruleModal && (
        <RuleEditorModal
          mode={ruleModal.mode}
          initialRule={
            ruleModal.mode === "edit"
              ? draft.rules?.[ruleModal.index]
              : ruleModal.prefill
          }
          index={ruleModal.mode === "edit" ? ruleModal.index : undefined}
          existingRules={draft.rules ?? []}
          theme={draft}
          onSave={saveRule}
          onDelete={deleteRule}
          onCancel={closeRuleModal}
        />
      )}
    </>
  );
}
