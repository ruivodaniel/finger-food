// The spec of a canvas-own kind with one layout and no switches: what the registration points at when the kind has nothing to configure
import type { Spec } from "../../../../previewer-editors/types";
export const oneLayout = (id: string, name: string, description: string): Spec => ({ id, name, state: "approved", layouts: [{ id: "default", name, description, image: "none", props: [], hover: [] }] });
export const anything = { parse: (x: unknown) => x as never };
