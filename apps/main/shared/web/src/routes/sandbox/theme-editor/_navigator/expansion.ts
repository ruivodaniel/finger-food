import { ELEMENT_FAMILIES } from "../../../../../../../../../shared/libs/ui/web/theme-engine/conventions";
import type { NavSelection } from "../_core/types";

/**
 * Navigator expansion is owned by `Navigator` (a single Set<ExpansionKey>).
 * Sections are controlled — they receive `isOpen` / `toggle` and never own
 * their own expansion state.
 *
 * Two write paths:
 *   - `toggle(key)`           ← user clicks a section header
 *   - `setExpanded(focusKeysFor(sel))`  ← atomic replace, on focusPulse change
 */
export type ExpansionKey = string;

export type ExpansionAPI = {
  isOpen: (key: ExpansionKey) => boolean;
  toggle: (key: ExpansionKey) => void;
};

/**
 * Pure mapping: which keys must be open to reveal `selection` in the navigator.
 * Used on focusPulse change (inspect, future deep-links, search jumps) to
 * collapse everything not on the path to the target.
 */
export function focusKeysFor(sel: NavSelection): Set<ExpansionKey> {
  switch (sel.category) {
    case "primitives":
      return new Set(["primitives"]);
    case "families":
      return new Set(["families"]);
    case "elements": {
      const family = ELEMENT_FAMILIES[sel.path[0] ?? ""];
      return family
        ? new Set(["elements", `elements:${family}`])
        : new Set(["elements"]);
    }
    case "contextual":
      return new Set(["contextual"]);
    case "layouts":
      return new Set(["layouts"]);
    case "rules":
      return new Set(["rules"]);
  }
}
