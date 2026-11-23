// ============================================================
// ENGINE v3 — under: a surface that reaches under what sits over its edges
// A surface says `position: {under: {top: ["pageHeader"], bottom: ["pageFooter"]}}`. What it names then sits over it: out of the flow, at
// that edge of its own container. The surface that said it starts under them, and its content starts after them: the room at each edge is
// the size of what is over it, added up when there are several. A surface that is itself over something and under another at the same
// edge stands after it (a second bar below the first).
// The engine holds no description of the layout: it reads only what the surfaces say, and the size each named thing declares.
// ============================================================
import type { WebTheme as Theme } from '../../../types';
import { SCALE } from '../../../types/axes';
import { resolveSelector } from './conventions';
import { atScale, scaled } from './emit';

type Edge = 'top' | 'right' | 'bottom' | 'left';
const EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];
let SAID: { selector: string; under: Partial<Record<Edge, string[]>> }[] = [];
export const resetUnder = (): void => { SAID = []; };
export const registerUnder = (selector: string, under: Record<string, string[]>): void => { SAID.push({ selector, under }); };

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export function underToCSS(theme: Theme): string[] {
  if (!SAID.length) return [];
  const out: string[] = [];
  const t = theme as unknown as { layouts?: Record<string, { surface?: Record<string, unknown> }>; elements?: Record<string, Record<string, unknown>> };
  /** the size a named thing declares on an axis, by scale */
  const sizeOf = (name: string, axis: 'width' | 'height'): Record<string, string> | undefined => {
    const el = t.elements?.[name];
    const surface = t.layouts?.[name]?.surface ?? ((el?.surface as Record<string, unknown> | undefined) ?? el);
    return (surface?.dimensions as Record<string, Record<string, string>> | undefined)?.[axis];
  };
  // what is over something, and at which edge
  const over = new Map<string, Edge>();
  for (const said of SAID) for (const edge of EDGES) for (const name of said.under[edge] ?? []) over.set(name, edge);
  const variable = (name: string) => `--over-${kebab(name)}`;
  const room = (names: string[]) => (names.length === 1 ? `var(${variable(names[0])}, 0px)` : `calc(${names.map((n) => `var(${variable(n)}, 0px)`).join(' + ')})`);

  for (const [name, edge] of over) {
    const selector = resolveSelector(name);
    if (!selector) { out.push(`/* under: "${name}" names nothing the theme knows */`); continue; }
    const axis = edge === 'top' || edge === 'bottom' ? 'height' : 'width';
    const by = sizeOf(name, axis), md = atScale(by, 'md');
    if (!md) out.push(`/* under: ${name} declares no ${axis}; nothing is under it */`);
    // it sits over only on a screen where a surface says it is under it: the same thing stands in the flow everywhere else
    const sayers = [...new Set(SAID.filter((x) => EDGES.some((e) => (x.under[e] ?? []).includes(name))).map((x) => x.selector))];
    const where = (rest: string) => sayers.map((x) => `:root:has(${x})${rest}`).join(',\n');
    // its size, told to the whole screen as a variable: by its scale, and none while it is away
    out.push(`${where(`:has(${selector})`)} {\n  ${variable(name)}: ${scaled(axis, md ?? '0px')};\n}`);
    for (const sc of SCALE) { const v = atScale(by, sc); if (sc !== 'md' && v && v !== md) out.push(`${where(`:has(${selector}[scale="${sc}"])`)} {\n  ${variable(name)}: ${scaled(axis, v)};\n}`); }
    out.push(`${where(`:has(${selector}[flag~="away"])`)} {\n  ${variable(name)}: 0px;\n}`);
    // out of the flow, along that edge of its container
    const along = axis === 'height' ? 'left: 0;\n  right: 0;' : 'top: 0;\n  bottom: 0;';
    out.push(`${where(` ${selector}`)} {\n  position: absolute;\n  ${edge}: 0;\n  ${along}\n  z-index: 2;\n}`);
    out.push(`${where(` :where(:has(> ${selector}))`)} {\n  position: relative;\n}`);
  }

  for (const said of SAID) {
    // the surface that said it may itself be over something: it then stands after what it is under, at the edge it sits on
    const self = [...over].find(([name]) => resolveSelector(name) === said.selector);
    for (const edge of EDGES) {
      const names = (said.under[edge] ?? []).filter((n) => resolveSelector(n));
      if (!names.length) continue;
      if (self && self[1] === edge) { out.push(`${said.selector} {\n  ${edge}: ${room(names)};\n}`); continue; }
      // its content starts after what is over that edge. Top and bottom: room inside what scrolls, so the content passes under.
      // Left and right: room at the side, which shows the surface's own background
      if (edge === 'top' || edge === 'bottom') out.push(`${said.selector}::${edge === 'top' ? 'before' : 'after'} {\n  content: "";\n  display: block;\n  flex: none;\n  height: ${room(names)};\n}`);
      else out.push(`${said.selector} {\n  border-${edge}: ${room(names)} solid transparent;\n}`);
    }
  }
  return out;
}
