import type { Spec } from "../../types";

/** The TO-DO TREE: items to tick, nest and reorder. Every item can have items inside it, at any depth: there is no separate "group". It is controlled: the items and the collapsed rows come in, every change goes out.
 *  The schema of an item is `Node` (types in TodoTree.tsx): `id`, `title` (required), `detail`, `done`, `createdAt` (set when it is made), `completedAt` (set when it is ticked), `children`.
 *  What a row shows is the layout's switches: the path (1, 1.2…), the progress of an item with items inside (3/8), the detail (an "i" after the title, read on hover), and the three dates: when it was created, when it was completed,
 *  and how long it took. How it behaves is switches too: a click on the title opens or closes the item, a double click edits it, the add and edit buttons can each be off (independent of the clicks; the open arrow of an item with items inside is always there), and the two cascades of a tick: down (an item ticks what is inside it) and up (an item follows what is inside it). `hideDone` is not a switch but a filter the page owns (see TodoHideDone). The actions (the count, the filter, the new item) are not part of the tree: see actions.tsx. */
export const spec: Spec = {
  id: "todo-tree",
  name: "to-do tree",
  state: "draft",
  layouts: [
    { id: "tree", name: "tree", description: "a nested to-do; the title and what goes with it share a line; add, edit and open sit in three fixed places at every level", image: "none", props: [
      { name: "path", kind: "boolean", default: true }, { name: "progress", kind: "boolean", default: true }, { name: "detail", kind: "boolean", default: true },
      { name: "created", kind: "boolean", default: false }, { name: "completed", kind: "boolean", default: false }, { name: "duration", kind: "boolean", default: false },
      { name: "expandOnClick", kind: "boolean", default: false }, { name: "editOnDoubleClick", kind: "boolean", default: false },
      { name: "addButton", kind: "boolean", default: true }, { name: "editButton", kind: "boolean", default: true },
      { name: "cascadeDown", kind: "boolean", default: true }, { name: "cascadeUp", kind: "boolean", default: true },
    ], hover: [] },
  ],
};
