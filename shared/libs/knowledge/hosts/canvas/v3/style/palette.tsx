// The canvas's colours. The canvas ships a default palette made of the theme's content colours; it converts nothing. Whoever instantiates <Canvas> can give its own sections for any
// element: `colors={{ default, text, fill, border, line, icon, drawing }}`; an element with none uses `default`. The picker itself carries no colours: it receives these sections.
// The user's own colours live in memory for the life of the canvas, one list shared by every picker in it.
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { PickerColor, PickerSection } from "@libs/web-components";
import { THEME_SECTIONS, contentSection } from "../../../../theme/colors";

/** the elements that can have their own colours */
export type PaletteKey = "text" | "fill" | "border" | "line" | "icon" | "drawing" | "note";
export type CanvasColors = { default?: PickerSection[] } & Partial<Record<PaletteKey, PickerSection[]>>;

// The default palette is the theme's content colours (knowledge/theme/colors.ts): one section of the standard tones and one of the soft ones. The canvas converts nothing.
/** the canvas's default sections: the theme's standard tones, then its soft ones */
/** the theme's own two: what the page is drawn in and on (never white and black). First, so the transparent slot sits beside them. */
const THEME_PAIR: PickerSection = { id: "theme", label: "theme", colors: [{ value: "var(--foreground)", name: "foreground" }, { value: "var(--background)", name: "background" }] };
export const DEFAULT_SECTIONS: PickerSection[] = [THEME_PAIR, ...THEME_SECTIONS];
/** the soft section alone: what a note offers */
export const SOFT_SECTION: PickerSection = contentSection("soft");

type Ctx = { sections: (key: PaletteKey, fallback?: PickerSection[]) => PickerSection[]; user: PickerColor[]; add: (hex: string) => void; remove: (hex: string) => void };
const PaletteContext = createContext<Ctx | null>(null);

export function PaletteProvider({ colors, children }: { colors?: CanvasColors; children: ReactNode }) {
  const [user, setUser] = useState<PickerColor[]>([]);
  const value = useMemo<Ctx>(() => ({
    sections: (key, fallback) => colors?.[key] ?? fallback ?? colors?.default ?? DEFAULT_SECTIONS,
    user,
    add: (hex) => setUser((u) => (u.some((c) => c.value.toLowerCase() === hex.toLowerCase()) ? u : [...u, { value: hex }])),
    remove: (hex) => setUser((u) => u.filter((c) => c.value.toLowerCase() !== hex.toLowerCase())),
  }), [colors, user]);
  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>;
}

/** the sections a picker of this element shows: the element's colours from the consumer, else the element's own fallback (the note's ten tokens), else the default; then the user's own with its `+`. `transparent` puts the "No color" slot first. */
export function useSections(key: PaletteKey, transparent: boolean, fallback?: PickerSection[]): PickerSection[] {
  const ctx = useContext(PaletteContext);
  return useMemo(() => {
    const base = ctx ? ctx.sections(key, fallback) : (fallback ?? DEFAULT_SECTIONS);
    const first = base.map((s, i) => (i === 0 && transparent ? { ...s, allowTransparent: true } : s));
    const mine: PickerSection = { id: "user", label: "my colours", colors: ctx?.user ?? [], addable: true, onAdd: ctx?.add, onRemove: ctx?.remove };
    return [...first, mine];
  }, [ctx, key, transparent, fallback]);
}
