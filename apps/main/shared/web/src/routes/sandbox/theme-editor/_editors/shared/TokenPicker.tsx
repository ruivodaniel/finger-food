import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GradientDef } from "../../../../../../../../../../shared/libs/ui/types";
import type { TokenGroup } from "./colorTaxonomy";
import { COLOR_GROUPS, colorCssVar, isHexColor } from "./colorTaxonomy";
import { gradientCss } from "./gradientCss";
import type { InheritedProps } from "./inheritance";
import { inheritedState, inheritedTextCls } from "./inheritance";
import { usePopoverPlacement } from "./usePopoverPlacement";
import { useThemeRefs } from "./ThemeRefsContext";

type Props = InheritedProps<string> & {
  /** Token groups to show. Defaults to the full COLOR_GROUPS taxonomy. */
  groups?: TokenGroup[];
};

/**
 * Token picker: trigger button with current swatch + label, opens a portaled
 * popover with grouped, swatched tokens and a search bar. Used for `ColorRef`
 * fields.
 *
 * The popover is portaled to <body> and positioned via `usePopoverPlacement`
 * so it escapes the property panel's `overflow-y-auto` scroll clip and
 * auto-flips upward when there's not enough room below.
 *
 * Named gradients (`theme.gradients`) appear as a `Gradients` group at the
 * bottom of the picker, sourced from ThemeRefsContext. Each `gradient-<key>`
 * token renders its actual gradient as the swatch.
 */
export function TokenPicker({
  value,
  inherited,
  onChange,
  groups = COLOR_GROUPS,
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { gradients } = useThemeRefs();
  const state = inheritedState(value, inherited);
  const display = (value ?? inherited ?? "") as string;

  // Augment groups with the live gradients from theme.
  const allGroups = useMemo(() => {
    const gKeys = gradients ? Object.keys(gradients) : [];
    if (gKeys.length === 0) return groups;
    return [
      ...groups,
      { label: "Gradients", tokens: gKeys.map((k) => `gradient-${k}`) },
    ];
  }, [groups, gradients]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full h-[22px] px-1.5 text-[11px] rounded border border-zinc-200 bg-white text-left truncate flex items-center gap-1.5 ${inheritedTextCls(state)}`}
      >
        {display && !isHexColor(display) && (
          <Swatch token={display} gradients={gradients} />
        )}
        <span className="truncate">
          {state === "local"
            ? display
            : state === "inherited"
              ? `(${display})`
              : "(unset)"}
        </span>
      </button>
      {open && createPortal(
        <TokenPickerPopover
          triggerRef={triggerRef}
          current={display}
          groups={allGroups}
          gradients={gradients}
          onPick={(token) => {
            onChange(token);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />,
        document.body,
      )}
    </>
  );
}

/** Render a flat 3.5x3.5 swatch — color or gradient depending on token form. */
function Swatch({
  token,
  gradients,
  size = "w-3 h-3",
}: {
  token: string;
  gradients?: Record<string, GradientDef>;
  size?: string;
}) {
  if (token.startsWith("gradient-") && gradients) {
    const key = token.slice("gradient-".length);
    const def = gradients[key];
    return (
      <span
        className={`${size} rounded-sm border border-zinc-200 shrink-0`}
        style={{ background: gradientCss(def) }}
      />
    );
  }
  return (
    <span
      className={`${size} rounded-sm border border-zinc-200 shrink-0`}
      style={{ background: colorCssVar(token) }}
    />
  );
}

function TokenPickerPopover({
  triggerRef,
  current,
  groups,
  gradients,
  onPick,
  onClose,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  current: string;
  groups: TokenGroup[];
  gradients?: Record<string, GradientDef>;
  onPick: (token: string | undefined) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const activeRef = useRef<HTMLButtonElement>(null);
  const { style } = usePopoverPlacement(triggerRef, true, {
    width: 256,
    maxHeight: 320,
  });

  // Scroll the active token into view on first open. Only when no search is
  // active — once the user types, scrolling would feel jumpy.
  useEffect(() => {
    if (!search && activeRef.current) {
      activeRef.current.scrollIntoView({ block: "center" });
    }
    // Run once per popover instance — popover unmounts on close.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = search.toLowerCase();
  const filtered = q
    ? groups
        .map((g) => ({ ...g, tokens: g.tokens.filter((t) => t.toLowerCase().includes(q)) }))
        .filter((g) => g.tokens.length > 0)
    : groups;

  return (
    <>
      {/* Backdrop — click to dismiss. Higher than any in-panel content. */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      <div
        className="overflow-hidden bg-white border border-zinc-200 rounded-lg shadow-xl flex flex-col"
        style={{ ...style, zIndex: 9999 }}
      >
        <div className="p-1.5 border-b border-zinc-200 shrink-0">
          <input
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2 py-1 text-[11px] bg-zinc-100 border border-zinc-200 rounded"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => onPick(undefined)}
            className="w-full text-left px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-100 rounded"
          >
            — (unset)
          </button>
          {filtered.map((group) => (
            <div key={group.label}>
              <div className="px-2 pt-2 pb-0.5 text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                {group.label}
              </div>
              {group.tokens.map((token) => (
                <button
                  key={token}
                  ref={token === current ? activeRef : undefined}
                  type="button"
                  onClick={() => onPick(token)}
                  className={`w-full text-left px-2 py-0.5 text-[11px] hover:bg-zinc-100 rounded flex items-center gap-1.5 ${
                    token === current ? "bg-blue-500/10 text-blue-600 font-medium" : "text-zinc-900"
                  }`}
                >
                  <Swatch token={token} gradients={gradients} size="w-3.5 h-3.5" />
                  <span className="truncate">{token}</span>
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-3 text-[11px] text-zinc-500 italic text-center">
              No tokens match
            </div>
          )}
        </div>
      </div>
    </>
  );
}
