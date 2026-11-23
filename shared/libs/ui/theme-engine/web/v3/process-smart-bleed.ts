// ============================================================
// THEME PROCESS — Smart Bleed (the parent publishes, the child reads)
// ============================================================


// ── Smart bleed emission ───────────────────────────────────
// The child bleeds to its parent's edges. The parent is never named: every
// padded element publishes its padding, radius, border width and gap to its
// direct children as --parent-* variables (process-cascade, parentVars), and
// the bleed is fixed CSS reading them. Which edges bleed follows the parent's
// stack direction, read from the DOM (a Stack carries data-dir; a parent with
// none is a column): in a column the sides always, the top on a first child,
// the bottom on a last child; in a row the top and bottom always, the left on
// a first child, the right on a last child. On a bled edge the child takes the
// parent's padding as its default; a padding the theme sets on the child wins. Border
// modes bleed over the parent's border too. The corners follow the parent's
// inner radius, never below zero: a square parent gives square corners.

/** the children a parent's childrenSmartBleed reaches: the part zones and the child containers, a surface (header, content, footer, tile,
 *  alert, empty state, separator), a list, a table, a stack. Never a field, a control group, a media box, a control, a leaf: those sit inside a part */
export const BLEEDING_CHILDREN = ':is([element^="surface--"], [element^="list--"], [element^="table--"], [layout="stack"]):where(:not([element="surface--card"], [element="surface--panel"], [element="surface--section"], [element="surface--alert"]))';   // a nested container sits inside the padding like a content: it bleeds its own parts, never the outer's
const PARENT_VARS = ['pad-x', 'pad-y', 'radius-tl', 'radius-tr', 'radius-br', 'radius-bl', 'border-width', 'gap'];

/** the bleed a parent asks for its children. Parent padding is zeroed; parts (surface--header/content/footer) get the padding the parent would have had. Table, list, image, stack add nothing — they fill the parent edge to edge. */
export function emitChildrenSmartBleed(parentSelector: string): string[] {
  const px = 'var(--parent-pad-x, 0px)', py = 'var(--parent-pad-y, 0px)';
  const PARTS = '[element="surface--header"], [element="surface--footer"], [element="surface--content"] > [data-part="inner"], [element="surface--content"]:not(:has(> [data-part="inner"]))';
  return [
    // parent: no padding of its own; children span edge to edge
    `${parentSelector} { padding: 0; }`,
    // parts (header, footer, content): take the parent's would-be padding as their own
    `${parentSelector} > :is([element="surface--header"], [element="surface--footer"]) { padding-left: ${px}; padding-right: ${px}; }`,
    // the content's inner box: read the parent's values through the content (they'd be reset on [data-part] otherwise)
    `${parentSelector} > [element="surface--content"] { --inner-pad-x: ${px}; --inner-pad-y: ${py}; }`,
    `${parentSelector} > [element="surface--content"] > [data-part="inner"] { padding-left: var(--inner-pad-x, 0px); padding-right: var(--inner-pad-x, 0px); }`,
    // first/last-child vertical padding on the parts: the parent's would-be y padding
    `${parentSelector} > [element="surface--header"] { padding-top: ${py}; }`,
    `${parentSelector} > [element="surface--footer"] { padding-bottom: ${py}; }`,
    // content with no header/footer siblings should get full y padding; keep the simpler rule: content's inner box takes y padding always
    `${parentSelector} > [element="surface--content"] > [data-part="inner"] { padding-top: var(--inner-pad-y, 0px); padding-bottom: var(--inner-pad-y, 0px); }`,
    // tabs: the root is a direct child and adds no box; its tab bar takes the side padding like a header, each panel (a Content) pads its inner box
    `${parentSelector} > [element="surface--tabs"] > [element="control-group--tab-bar"] { padding-left: ${px}; padding-right: ${px}; }`,
    `${parentSelector} > [element="surface--tabs"] > [element="surface--content"] { --inner-pad-x: ${px}; --inner-pad-y: ${py}; }`,
    `${parentSelector} > [element="surface--tabs"] > [element="surface--content"] > [data-part="inner"] { padding: var(--inner-pad-y, 0px) var(--inner-pad-x, 0px); }`,
  ];
}

/** a child that opts out of its parent's childrenSmartBleed: back inside the padding */
export function emitNoBleed(childSelector: string): string[] {
  return [`${childSelector}, ${childSelector}:first-child, ${childSelector}:last-child, ${childSelector}:only-child {\n  margin: 0;\n}`];
}

export function emitSmartBleed(childSelector: string, opts: { parent?: string } = {}): string[] {
  const rules: string[] = [];
  // the part reaches the parent's inner edge, never over its border; the outer corners follow the parent's inner radius, the interior
  // edges are straight
  const bleedBorder = false, roundedInterior = false;

  const px = 'var(--parent-pad-x, 0px)', py = 'var(--parent-pad-y, 0px)', bw = 'var(--parent-border-width, 0px)';   // the parent's, read from the DOM
  // how far the child reaches: the parent's padding, plus its border in border modes
  const reachX = bleedBorder ? `calc(${px} + ${bw})` : px;
  const reachY = bleedBorder ? `calc(${py} + ${bw})` : py;
  // the parent's inner radius: its radius minus its border (the child sits inside the border), or the radius itself in border modes
  const innerR = (corner: string) => bleedBorder ? `max(0px, var(--parent-radius-${corner}, 0px))` : `max(0px, calc(var(--parent-radius-${corner}, 0px) - ${bw}))`;
  // the child under a column or a row parent: the parent combinator goes right before the child's last compound, and the parent may be the
  // scope itself (a concept on the card) or anything inside it; a parent with no data-dir is a column
  // a parent given: "<parent> > <child>", the parent part already weighed by the caller. Otherwise the child's scope: the parent is the scope itself or anything inside it
  const scope = opts.parent ? '' : (childSelector.lastIndexOf(' ') < 0 ? '' : childSelector.slice(0, childSelector.lastIndexOf(' ')));
  const child = opts.parent ? childSelector.slice(childSelector.lastIndexOf(' > ') + 3) : (childSelector.lastIndexOf(' ') < 0 ? childSelector : childSelector.slice(childSelector.lastIndexOf(' ') + 1));
  const parentOf = (dir: string) => (opts.parent ? `${opts.parent}${dir}` : scope ? `:is(${scope}, ${scope} *)${dir}` : dir);
  // the margins and the corners, at full strength
  const under = (dir: string, pos: string) => `${parentOf(dir)} > ${child}${pos}`;
  const margin = (side: 'left' | 'right' | 'top' | 'bottom') => `  margin-${side}: calc(-1 * ${side === 'left' || side === 'right' ? reachX : reachY});`;
  // on a bled edge the child takes the parent's padding as its default, so what it holds lines up with the parent's content; the rule weighs the
  // child's own selector alone (the parent part and the position in :where), so a padding the theme writes on the child wins
  const padding = (side: 'left' | 'right' | 'top' | 'bottom') => `  padding-${side}: ${side === 'left' || side === 'right' ? px : py};`;
  // a content is two boxes: the outer one scrolls, the inner one carries the padding, so the soft padding lands on the inner box.
  // The soft padding applies only to the text parts (Header, Content, Footer). Table/List/RemoteImage/Stack/Tile bleed with margin only.
  const SOFT_PADDED = ':is([element="surface--header"], [element="surface--footer"])';
  const soft = (dir: string, pos: string) => `:where(${parentOf(dir)}) > ${child}${pos ? `:where(${pos})` : ''}${SOFT_PADDED}, :where(${parentOf(dir)}) > ${child}${pos ? `:where(${pos})` : ''}:where([element="surface--content"]) > [data-part="inner"]`;
  const corners = (tl: boolean, tr: boolean, br: boolean, bl: boolean) => [
    `  border-top-left-radius: ${tl ? innerR('tl') : '0'};`,
    `  border-top-right-radius: ${tr ? innerR('tr') : '0'};`,
    `  border-bottom-right-radius: ${br ? innerR('br') : '0'};`,
    `  border-bottom-left-radius: ${bl ? innerR('bl') : '0'};`,
  ];
  const r = roundedInterior;
  type Side = 'left' | 'right' | 'top' | 'bottom';
  const bleed = (dir: string, pos: string, sides: Side[], c?: boolean[]) => {
    rules.push([`${under(dir, pos)} {`, ...sides.map(margin), ...(c ? corners(c[0], c[1], c[2], c[3]) : []), `}`].join('\n'));
    rules.push([`${soft(dir, pos)} {`, ...sides.map(padding), `}`].join('\n'));
  };

  // a column parent (the default): the sides always, the top on a first child, the bottom on a last child
  const col = ':not([data-dir="row"])', row = '[data-dir="row"]';
  bleed(col, '', ['left', 'right']);
  bleed(col, ':first-child', ['top'], [true, true, r, r]);
  bleed(col, ':last-child', ['bottom'], [r, r, true, true]);
  bleed(col, ':only-child', ['top', 'bottom'], [true, true, true, true]);

  // a row parent: the top and bottom always, the left on a first child, the right on a last child
  bleed(row, '', ['top', 'bottom']);
  bleed(row, ':first-child', ['left'], [true, r, r, true]);
  bleed(row, ':last-child', ['right'], [r, true, true, r]);
  bleed(row, ':only-child', ['left', 'right'], [true, true, true, true]);

  return rules;
}

// ── Icon zone bleed ────────────────────────────────────────
// the start or end icon zone of a control bleeds to the control's edge: the control publishes its padding, radius and border width to its
// direct children (process-cascade, parentVars) and the zone reads them

export function emitIconZoneBleed(zone: 'start' | 'end', childSelector: string): string[] {
  const px = 'var(--parent-pad-x, 0px)', py = 'var(--parent-pad-y, 0px)', bw = 'var(--parent-border-width, 0px)';
  const innerR = (corner: string) => `max(0px, calc(var(--parent-radius-${corner}, 0px) - ${bw}))`;
  const side = zone === 'start' ? 'left' : 'right', other = zone === 'start' ? 'right' : 'left';
  return [[
    `${childSelector} {`,
    `  align-self: stretch;`,
    `  display: flex;`,
    `  align-items: center;`,
    `  margin-${side}: calc(-1 * ${px});`,
    `  margin-top: calc(-1 * ${py});`,
    `  margin-bottom: calc(-1 * ${py});`,
    `  padding-${side}: ${px};`,
    `  padding-top: ${py};`,
    `  padding-bottom: ${py};`,
    `  border-top-${side}-radius: ${innerR(zone === 'start' ? 'tl' : 'tr')};`,
    `  border-bottom-${side}-radius: ${innerR(zone === 'start' ? 'bl' : 'br')};`,
    `  border-top-${other}-radius: 0;`,
    `  border-bottom-${other}-radius: 0;`,
    `}`,
  ].join('\n')];
}
