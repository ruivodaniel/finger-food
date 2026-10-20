// =============================================================================
// Shared inheritance pattern types & helpers.
//
// Every leaf control receives { value, inherited?, onChange }.
// - value     — locally set value (may be undefined)
// - inherited — value from parent scope (may be undefined)
// - onChange  — callback receives the new value or undefined to clear
//
// Display rules:
//   - if value is set       → show fully opaque
//   - else if inherited set → show dimmed/italic with parens
//   - else                  → show placeholder ("(unset)" or em-dash)
// =============================================================================

export type InheritedState = "local" | "inherited" | "unset";

export type InheritedProps<T> = {
  value: T | undefined;
  inherited?: T | undefined;
  onChange: (next: T | undefined) => void;
};

export function inheritedState(value: unknown, inherited: unknown): InheritedState {
  if (value != null) return "local";
  if (inherited != null) return "inherited";
  return "unset";
}

/** Class string for input chrome based on inheritance state. */
export function inheritedTextCls(state: InheritedState): string {
  return state === "local"
    ? "text-zinc-900"
    : "text-zinc-400 italic";
}

/** Format a value for display when shown as inherited (parenthesized hint). */
export function formatInherited(v: unknown): string {
  if (v == null) return "";
  return `(${String(v)})`;
}
