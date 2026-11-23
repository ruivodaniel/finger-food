// The knowledge hosts' default colours: the theme's content colours as two picker sections, standard then soft, in the order of the families.
// The values are theme tokens (var(--color-content-<hue>-<tone>)): the theme adapts them to its mode, a host never does.
import type { PickerSection } from "@libs/web-components";
import { RADIX_FAMILIES } from "../../ui/types/color-system";

export type ContentTone = "standard" | "soft";
export const contentSection = (tone: ContentTone): PickerSection => ({
  id: tone, label: tone, colors: Object.values(RADIX_FAMILIES).flat().map((hue) => ({ value: `var(--color-content-${hue}-${tone})`, name: hue })),
});
/** standard, then soft */
export const THEME_SECTIONS: PickerSection[] = [contentSection("standard"), contentSection("soft")];
/** an ordered list taken in a spread: each next item far from the previous one, so what is handed out one by one (a new tag, a new column) does not come out as neighbours */
export function spread<T>(items: T[]): T[] {
  const n = items.length; if (n < 3) return items;
  let step = Math.max(1, Math.round(n * 0.382));
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  while (gcd(step, n) !== 1) step++;
  return items.map((_, i) => items[(i * step) % n]);
}
