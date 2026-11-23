import { useState } from "react";
import { Card, Content, Header, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { TodoAddButton, TodoCount, TodoHideDone, TodoTree, idsWithChildren, newNode, type TodoNode } from "@libs/knowledge/previewer-editors/todo-tree";
import { Instance, instances } from "../../../../lib/instance";
import { sample } from "../sample";

/** Example 2 — the same tree in a card, the controls in the card's header: the title and the new item on one line, the count and the filter under it. Instantiated differently: no add or edit buttons on the rows (a click on a title
 *  opens or closes the item, a double click edits it; the open arrow stays, to show who has children), and only the cascade up on: an item follows what is inside it, but ticking an item changes only itself. */
const ID = "todo-2";
export const measure = "md";

export default function TodoExample2() {
  const [editId, setEditId] = useState<string | null>(null);
  return (
    <Instance id={ID} initial={{ data: { nodes: sample(), closed: Object.fromEntries(idsWithChildren(sample()).map((id) => [id, true])), hideDone: false } }}>
      {(x) => {
        const nodes = x.data.nodes as TodoNode[];
        const patch = (p: Record<string, unknown>) => instances.patch(ID, "data", p);
        return (
          <Card className="w-full">
            <Header>
              <Stack dir="col" scale="sm">
                <Stack dir="row" align="center" justify="between" scale="md">
                  <Text type="heading3">To do</Text>
                  <TodoAddButton onClick={() => { const n = newNode(); patch({ nodes: [...nodes, n] }); setEditId(n.id); }} />
                </Stack>
                <Stack dir="row" align="center" justify="between" scale="md">
                  <TodoCount nodes={nodes} />
                  <TodoHideDone value={x.data.hideDone as boolean} onChange={(hideDone) => patch({ hideDone })} />
                </Stack>
              </Stack>
            </Header>
            <Content>
              <TodoTree nodes={nodes} onChange={(next) => patch({ nodes: next })} closed={x.data.closed as Record<string, boolean>} onClosed={(closed) => patch({ closed })}
                hideDone={x.data.hideDone as boolean} editId={editId} expandOnClick editOnDoubleClick buttons={{ add: false, edit: false }} cascadeDown={false} />
            </Content>
          </Card>
        );
      }}
    </Instance>
  );
}
