// The canvas's own kinds: what every canvas can draw without a previewer-editor. Gathered here for whoever instantiates a canvas (`...canvasOwnKinds`).
import type { Registrations } from "../canvas-registration";
import { text } from "./text/canvas-registration";
import { rectangle } from "./rectangle/canvas-registration";
import { container } from "./container/canvas-registration";
import { frame } from "./frame/canvas-registration";
import { image } from "./image/canvas-registration";
import { drawing } from "./drawing/canvas-registration";
import { icon } from "./icon/canvas-registration";
import { point } from "./point/canvas-registration";
export const canvasOwnKinds: Registrations = { text, rectangle, container, frame, image, drawing, icon, point } as Registrations;
export { text, rectangle, container, frame, image, drawing, icon, point };
export { CanvasNodeView, nodeTypes, type NodeData } from "./Node";
