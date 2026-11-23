import { useState } from "react";
import { Stack } from "@libs/web-layouts";
import { TodoAddButton, TodoCount, TodoHideDone, TodoTree, idsWithChildren, newNode, type TodoNode } from "@libs/knowledge/previewer-editors/todo-tree";
import { Instance, instances } from "../../../../lib/instance";
import { sample } from "../sample";

/** Example 1 — the to-do tree with its actions in a header above the list. The tree is controlled: the items and the collapsed rows come in, every change goes out; here the store holds them (open the store tab: tick an item,
 *  drag one, and the JSON follows). The actions are not part of the tree: the count and the "hide done" filter on the left, the new item on the right, each a small component the page places.
 *  Instantiated with: the add, edit and open buttons on every row, no click behaviours, both cascades on, and the dates of what is done. */
const ID = "todo-1";
export const measure = "md";

export default function TodoExample1() {
  const [editId, setEditId] = useState<string | null>(null);
  return (
    <Instance id={ID} initial={{ data: { nodes: sample(), closed: Object.fromEntries(idsWithChildren(sample()).map((id) => [id, true])), hideDone: false } }}>
      {(x) => {
        const nodes = x.data.nodes as TodoNode[];
        const patch = (p: Record<string, unknown>) => instances.patch(ID, "data", p);
        return (
          <Stack dir="col" scale="sm">
            <Stack dir="row" align="center" justify="between" scale="md">
              <Stack dir="row" align="center" scale="lg">
                <TodoCount nodes={nodes} />
                <TodoHideDone value={x.data.hideDone as boolean} onChange={(hideDone) => patch({ hideDone })} />
              </Stack>
              <TodoAddButton onClick={() => { const n = newNode(); patch({ nodes: [...nodes, n] }); setEditId(n.id); }} />
            </Stack>
            <TodoTree nodes={nodes} onChange={(next) => patch({ nodes: next })} closed={x.data.closed as Record<string, boolean>} onClosed={(closed) => patch({ closed })}
              hideDone={x.data.hideDone as boolean} show={{ completed: true, duration: true }} editId={editId} />
          </Stack>
        );
      }}
    </Instance>
  );
}
