// HANDLES — the connection handles a node offers. Levels: the node [N] → the template's override for the kind and layout [T] → the registration's layout → the template's defaults.
import type { HandleId, Registrations } from "../canvas-registration";
import type { CanvasNode } from "../document";
import type { Template } from "../template";
import { layoutOnCanvas } from "./size";

export const handlesOf = (n: CanvasNode, t: Template, all: Registrations): HandleId[] => n.handles ?? layoutOnCanvas(n, t, all)?.handles ?? t.defaults.handles;
