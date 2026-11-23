// The kanban's colours, the way the canvas has them: by default the board uses the theme's content colours (standard, then soft); whoever instantiates it may give its own sections, for the tags and for the columns,
// each colour a theme token (`var(--color-brand-1)`) or any colour. A tag without a colour takes the next one of the pool that no other tag uses; a column without a `tone` takes the one of its position.
import type { Section as PickerSection } from "../../../../ui/web/primitives/components/color-picker/v2";
import { THEME_SECTIONS, spread } from "../../../theme/colors";

export type KanbanColors = { default?: PickerSection[]; tags?: PickerSection[]; columns?: PickerSection[] };
export const DEFAULT_SECTIONS: PickerSection[] = THEME_SECTIONS;
/** the sections of one element: its own, else the default the consumer gave, else the board's */
export const sectionsOf = (colors: KanbanColors | undefined, key: "tags" | "columns"): PickerSection[] => colors?.[key] ?? colors?.default ?? DEFAULT_SECTIONS;
export const flat = (sections: PickerSection[]): string[] => sections.flatMap((s) => s.colors.map((c) => c.value));
/** the colours handed out one by one: the consumer's own palette in its order, or (by default) the theme's standard tones in a spread, so neighbours are not the same hue */
export const poolOf = (colors: KanbanColors | undefined, key: "tags" | "columns"): string[] => { const own = colors?.[key] ?? colors?.default; return own ? flat(own) : spread(flat([THEME_SECTIONS[0]])); };
/** the tags' colours with the missing ones filled: each new tag the first colour of the pool no tag has yet (then the pool again) */
export function withTagColours(tags: string[], have: Record<string, string>, palette: string[]): Record<string, string> {
  if (!palette.length) return have;
  const out = { ...have };
  for (const t of tags) {
    if (out[t]) continue;
    const used = new Set(Object.values(out));
    out[t] = palette.find((c) => !used.has(c)) ?? palette[Object.keys(out).length % palette.length];
  }
  return out;
}

/** a tag chip in its colour: the colour tints the chip and writes the text */
export const tagStyle = (c: string): React.CSSProperties => ({ color: c, background: `color-mix(in srgb, ${c} 16%, transparent)`, borderColor: c });
/** the same chip chosen: a stronger tint of the colour behind, the text the theme's foreground; nothing is converted */
export const tagStyleOn = (c: string): React.CSSProperties => ({ background: `color-mix(in srgb, ${c} 32%, transparent)`, borderColor: c, color: "var(--foreground)" });
