// SIZE — a node's box, per axis: content, measured as drawn (shapeshifts included); user, the person's, saved on the node, with resize handles.
// Levels: the template's override for the kind and layout [T] → the registration's layout. The node holds no size rule, only its width and height where an axis is "user".
import type { Axis, LayoutId, LayoutOnCanvas, Registrations, Size } from "../canvas-registration";
import type { CanvasNode } from "../document";
import type { Template } from "../template";
import { registrationIn } from "../template";

export const layoutOf = (n: CanvasNode, t: Template, all: Registrations): LayoutId => n.layout ?? registrationIn(t, all, n.kind)?.layout.default ?? "default";
/** the registration's entry for the node's layout, as the template sees it */
export const layoutOnCanvas = (n: CanvasNode, t: Template, all: Registrations): LayoutOnCanvas | undefined => registrationIn(t, all, n.kind)?.layouts[layoutOf(n, t, all)];
const CONTENT: Size = { width: "content", height: "content" };
export const sizeOf = (n: CanvasNode, t: Template, all: Registrations): Size => layoutOnCanvas(n, t, all)?.size ?? CONTENT;
export const isUser = (a: Axis) => a === "user";
export const allowsW = (n: CanvasNode, t: Template, all: Registrations) => isUser(sizeOf(n, t, all).width);
export const allowsH = (n: CanvasNode, t: Template, all: Registrations) => isUser(sizeOf(n, t, all).height);
