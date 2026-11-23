// The arrange, align and distribute pictures, drawn here as Miro draws them: bars for the boxes, a line for the edge they meet. 20 by 20, currentColor.
const G = ({ children }: { children: React.ReactNode }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>;
const Bar = (p: { x: number; y: number; w: number; h: number; fill?: boolean }) => <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="1" fill={p.fill ? "currentColor" : "none"} />;
/** a square of the layer-order pictures: the selected one filled, every other an outline that hides what is behind it (so in front and behind read apart). Drawn in stack order: what is behind first */
const Sq = (p: { x: number; y: number; w: number; h: number; fill?: boolean }) => <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="1" fill={p.fill ? "currentColor" : "var(--background)"} />;

export const GLYPHS = {
  // layer order, as Daniel drew it (2 Nov): the selected square filled; forward, it is top-left in front of one outline; backward, bottom-right behind one; to front, top-left in front of two; to back, bottom-right behind two
  forward: <G><Sq x={8} y={8} w={9} h={9} /><Sq x={3} y={3} w={9} h={9} fill /></G>,
  backward: <G><Sq x={8} y={8} w={9} h={9} fill /><Sq x={3} y={3} w={9} h={9} /></G>,
  front: <G><Sq x={11} y={11} w={7} h={7} /><Sq x={6} y={6} w={8} h={8} /><Sq x={2} y={2} w={7} h={7} fill /></G>,
  back: <G><Sq x={11} y={11} w={7} h={7} fill /><Sq x={6} y={6} w={8} h={8} /><Sq x={2} y={2} w={7} h={7} /></G>,
  // align: a line where the boxes meet, two bars of different lengths
  left: <G><path d="M3 2v16" /><Bar x={5} y={4} w={11} h={4} /><Bar x={5} y={12} w={7} h={4} /></G>,
  hcenter: <G><path d="M10 2v16" /><Bar x={4} y={4} w={12} h={4} /><Bar x={6} y={12} w={8} h={4} /></G>,
  right: <G><path d="M17 2v16" /><Bar x={4} y={4} w={11} h={4} /><Bar x={8} y={12} w={7} h={4} /></G>,
  top: <G><path d="M2 3h16" /><Bar x={4} y={5} w={4} h={11} /><Bar x={12} y={5} w={4} h={7} /></G>,
  vmiddle: <G><path d="M2 10h16" /><Bar x={4} y={4} w={4} h={12} /><Bar x={12} y={6} w={4} h={8} /></G>,
  bottom: <G><path d="M2 17h16" /><Bar x={4} y={4} w={4} h={11} /><Bar x={12} y={8} w={4} h={7} /></G>,
  // distribute: the outer edges as lines, the boxes evenly between them
  "distribute-h": <G><path d="M2 3v14M18 3v14" /><Bar x={5} y={6} w={3} h={8} /><Bar x={12} y={6} w={3} h={8} /></G>,
  "distribute-v": <G><path d="M3 2h14M3 18h14" /><Bar x={6} y={5} w={8} h={3} /><Bar x={6} y={12} w={8} h={3} /></G>,
  grid: <G><Bar x={3} y={3} w={5} h={5} /><Bar x={12} y={3} w={5} h={5} /><Bar x={3} y={12} w={5} h={5} /><Bar x={12} y={12} w={5} h={5} /></G>,
  // the styles: a paint roller
  styles: <G><rect x="3" y="2.5" width="12" height="6" rx="1" /><path d="M15 5.5h1.5v4.5H10v2.5" /><rect x="8.5" y="12.5" width="3" height="5.5" rx="0.8" /></G>,
  // click to highlight: the node in focus and the one it connects to lit, the other dimmed
  highlight: <G><Bar x={2} y={7} w={6} h={6} fill /><Bar x={13} y={2} w={5} h={5} /><path d="M8 9l5-4" /><g opacity=".35"><Bar x={13} y={13} w={5} h={5} /><path d="M8 11l5 4" /></g></G>,
  // spotlight: the node in focus lit, everything else faded
  spotlight: <G><Bar x={7} y={7} w={6} h={6} fill /><g opacity=".35"><Bar x={2} y={2} w={4} h={4} /><Bar x={14} y={2} w={4} h={4} /><Bar x={2} y={14} w={4} h={4} /><Bar x={14} y={14} w={4} h={4} /></g></G>,
  // line numbers: numbers beside two lines
  linenumbers: <G><path d="M3.5 4.5h1.5V9M3.5 15.5h3l-3-3h3" /><path d="M10 6h7M10 14h7" /></G>,
  // the three triggers
  arrange: <G><Sq x={3} y={3} w={9} h={9} /><Sq x={8} y={8} w={9} h={9} fill /></G>,
  align: <G><path d="M3 2v16" /><Bar x={5} y={4} w={11} h={4} /><Bar x={5} y={12} w={7} h={4} /></G>,
  distribute: <G><path d="M2 3v14M18 3v14" /><Bar x={5} y={6} w={3} h={8} /><Bar x={12} y={6} w={3} h={8} /></G>,
};
export type Glyph = keyof typeof GLYPHS;
