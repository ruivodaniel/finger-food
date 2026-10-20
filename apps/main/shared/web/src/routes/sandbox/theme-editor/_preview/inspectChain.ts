import {
  ELEMENT_FAMILIES,
  FAMILY_PREFIXES,
  TABLE_ELEMENT_NAMES,
} from "../../../../../../../../../shared/libs/ui/web/theme-engine/conventions";

// =============================================================================
// Inspect chain
//
// Walk the DOM from `el` up to `container` and collect every theme-relevant
// row found on each ancestor. A single DOM node can produce MULTIPLE rows —
// e.g. `<div element="surface--page-header" layout="page-header">` yields
// both an element row AND a layout row. Concept attribute (`concept="X"`)
// attached to the same node is recorded on each row.
//
// Order: leaf-first (most-specific at index 0, root at the end).
// =============================================================================

export type ChainRow = {
  node: HTMLElement;
  kind: "element" | "family" | "layout";
  /** Theme key — e.g. "card", "interactiveControl", "pageHeader". */
  key: string;
  /** Value of `concept="…"` on the same DOM node, if any. */
  concept?: string;
};

// Reverse lookups built once at module load.
const ELEMENT_VALUE_MAP: Record<
  string,
  { elementKey: string; familyKey: string }
> = {};
for (const [elementKey, familyKey] of Object.entries(ELEMENT_FAMILIES)) {
  const prefix = FAMILY_PREFIXES[familyKey];
  if (!prefix) continue;
  // Table elements use a custom short name (e.g. tableHeaderCell → "header-cell")
  // to avoid redundant prefixing in the DOM attr value (`table--header-cell`).
  // Other families use camelToKebab on the element key.
  const localName =
    familyKey === "tableElement"
      ? TABLE_ELEMENT_NAMES[elementKey] ?? camelToKebab(elementKey)
      : camelToKebab(elementKey);
  ELEMENT_VALUE_MAP[`${prefix}--${localName}`] = {
    elementKey,
    familyKey,
  };
}
const PREFIX_TO_FAMILY: Record<string, string> = {};
for (const [familyKey, prefix] of Object.entries(FAMILY_PREFIXES)) {
  PREFIX_TO_FAMILY[prefix] = familyKey;
}

function camelToKebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Extract every theme row from a single DOM node. Returns 0 or more rows;
 * a node with both `element=` and `layout=` produces both.
 */
function rowsForNode(node: HTMLElement): ChainRow[] {
  const concept = node.getAttribute("concept") ?? undefined;
  const rows: ChainRow[] = [];

  // element="<prefix>--<key>"
  const elAttr = node.getAttribute("element");
  if (elAttr) {
    const known = ELEMENT_VALUE_MAP[elAttr];
    if (known) {
      rows.push({ node, kind: "element", key: known.elementKey, concept });
    } else {
      const dashIdx = elAttr.indexOf("--");
      if (dashIdx > 0) {
        const prefix = elAttr.slice(0, dashIdx);
        const familyKey = PREFIX_TO_FAMILY[prefix];
        if (familyKey) {
          rows.push({ node, kind: "family", key: familyKey, concept });
        }
      }
    }
  }

  // layout="<kebab-key>"
  const layoutAttr = node.getAttribute("layout");
  if (layoutAttr) {
    rows.push({
      node,
      kind: "layout",
      key: kebabToCamel(layoutAttr),
      concept,
    });
  }

  return rows;
}

/**
 * Walk from `el` up to (and including) `container`, collecting all
 * theme-relevant rows in cascade order (most specific first).
 */
export function collectThemeChain(
  el: HTMLElement,
  container: HTMLElement,
): ChainRow[] {
  const chain: ChainRow[] = [];
  let node: HTMLElement | null = el;
  while (node && container.contains(node)) {
    chain.push(...rowsForNode(node));
    node = node.parentElement;
  }
  return chain;
}
