import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { InheritedProps } from "./inheritance";
import { inheritedState, inheritedTextCls } from "./inheritance";
import { usePopoverPlacement } from "./usePopoverPlacement";

type FontGroup = { label: string; fonts: string[] };

const FONT_GROUPS: FontGroup[] = [
  {
    label: "Sans Serif",
    fonts: [
      "Inter", "Roboto", "Open Sans", "Lato", "Montserrat",
      "Nunito", "Poppins", "Plus Jakarta Sans", "DM Sans", "Manrope",
    ],
  },
  {
    label: "Serif",
    fonts: [
      "Playfair Display", "Merriweather", "Lora",
      "DM Serif Display", "Crimson Text", "Source Serif Pro",
    ],
  },
  {
    label: "Monospace",
    fonts: ["JetBrains Mono", "Fira Code", "Source Code Pro", "IBM Plex Mono"],
  },
];

const ALL_FONTS = FONT_GROUPS.flatMap((g) => g.fonts);

/** Lazy-load Google Fonts the first time a font name is referenced for preview. */
const loadedFonts = new Set<string>();
function ensureFontLoaded(font: string) {
  if (typeof document === "undefined") return;
  if (loadedFonts.has(font)) return;
  loadedFonts.add(font);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

type Props = InheritedProps<string> & {
  className?: string;
};

/**
 * Font family picker. Shows current font name rendered IN that font.
 * Combines free-text input + portaled, auto-flipping popover dropdown of
 * common Google fonts.
 */
export function FontFamilySelect({ value, inherited, onChange, className }: Props) {
  const state = inheritedState(value, inherited);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const effective = (value ?? inherited ?? "") as string;

  useEffect(() => {
    if (effective && ALL_FONTS.includes(effective)) ensureFontLoaded(effective);
  }, [effective]);

  const display = draft !== null ? draft : (value ?? "") as string;

  return (
    <div className={`flex-1 min-w-0 ${className ?? ""}`}>
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={display}
          placeholder={state === "inherited" ? String(inherited) : "—"}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft != null) onChange(draft || undefined);
            setDraft(null);
          }}
          style={{ fontFamily: effective ? `"${effective}", system-ui` : undefined }}
          className={`flex-1 min-w-0 px-1.5 text-[11px] rounded border border-zinc-200 bg-white h-[22px] ${inheritedTextCls(state)}`}
        />
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="px-1 h-[22px] text-[10px] rounded border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 shrink-0"
          title="Browse fonts"
        >
          ▾
        </button>
      </div>
      {open && createPortal(
        <FontPopover
          triggerRef={triggerRef}
          current={effective}
          onPick={(f) => {
            onChange(f);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />,
        document.body,
      )}
    </div>
  );
}

function FontPopover({
  triggerRef,
  current,
  onPick,
  onClose,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  current: string;
  onPick: (font: string | undefined) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const { style } = usePopoverPlacement(triggerRef, true, {
    width: 288,
    maxHeight: 320,
  });

  const q = search.toLowerCase();
  const filtered = q
    ? FONT_GROUPS.map((g) => ({ ...g, fonts: g.fonts.filter((f) => f.toLowerCase().includes(q)) }))
        .filter((g) => g.fonts.length > 0)
    : FONT_GROUPS;

  // Lazy-load preview fonts as the popover renders them
  useEffect(() => {
    filtered.forEach((g) => g.fonts.forEach(ensureFontLoaded));
  }, [filtered]);

  return (
    <>
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
            placeholder="Search fonts..."
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
              {group.fonts.map((font) => (
                <button
                  key={font}
                  type="button"
                  onClick={() => onPick(font)}
                  style={{ fontFamily: `"${font}", sans-serif` }}
                  className={`w-full text-left px-2 py-1 text-[13px] hover:bg-zinc-100 rounded ${
                    font === current ? "bg-blue-500/10 text-blue-600 font-medium" : "text-zinc-900"
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
