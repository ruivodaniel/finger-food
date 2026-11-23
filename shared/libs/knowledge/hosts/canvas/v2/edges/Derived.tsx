// DERIVED EDGES — the lines the data draws (an ERD's foreign keys): never stored. For each registration that brings `useDerivedEdges`, one of these calls its hook with the nodes of that kind
// on the board and hands the lines up; the canvas draws them with the template's style for the pair.
import { useEffect } from "react";
import type { CanvasRegistration, DerivedEdge } from "../canvas-registration";
import type { CanvasNode } from "../document";

export function Derived({ registration: r, nodes, onEdges }: { registration: CanvasRegistration; nodes: CanvasNode[]; onEdges: (kind: string, edges: DerivedEdge[]) => void }) {
  const edges = r.useDerivedEdges!(nodes.map((n) => ({ id: n.id, data: n.data })));
  const key = JSON.stringify(edges);
  useEffect(() => { onEdges(r.kind, edges); }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onEdges(r.kind, []), [r.kind]);   // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
