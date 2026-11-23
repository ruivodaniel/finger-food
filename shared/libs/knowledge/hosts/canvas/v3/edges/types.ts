// What every edge's React Flow `data` carries: the style resolved, the highlight, the fixed ends, the tension points and the canvas's callbacks (undefined in read mode)
import type { HighlightMode } from "../canvas-registration";
import type { Bend, Label } from "../document";
import type { EdgeStyle } from "../template";
import type { Edit } from "../../../../previewer-editors/editing/types";
export type EdgeData = { style: EdgeStyle; highlight?: boolean; highlightMode?: HighlightMode; /** which ends are plugged on a side (the others float) */ fixed?: { source: boolean; target: boolean }; bends?: Bend[]; /** in edit mode: the tension points, changed */ setBends?: (b: Bend[]) => void; label?: Label; labelLayout?: "title" | "dot"; edit?: Edit<Label>; /** in edit mode: a double click types the label in place */ inline?: { editing: boolean; start: () => void; commit: (title: string) => void; cancel: () => void }; /** the ERD drawing: the colour of the referenced table's source and the cardinality at each end */ erd?: { color: string; one?: string; many?: string } };
