import type { InheritedState } from "./inheritance";
import { inheritedState } from "./inheritance";

/**
 * Visual indicator for the left of every row:
 *   ●  local (blue)
 *   ○  inherited (muted)
 *   —  unset (very muted)
 *
 * Use as the `icon` prop of <Row /> when the row's left slot isn't claimed
 * by a contextual icon (e.g. RadiusIcon).
 */
export function InheritedDot({
  value,
  inherited,
}: {
  value: unknown;
  inherited?: unknown;
}) {
  const state: InheritedState = inheritedState(value, inherited);
  const glyph = state === "local" ? "●" : state === "inherited" ? "○" : "—";
  const cls =
    state === "local"
      ? "text-blue-500"
      : state === "inherited"
        ? "text-zinc-300"
        : "text-zinc-200";
  return <span className={`text-[10px] ${cls}`}>{glyph}</span>;
}
