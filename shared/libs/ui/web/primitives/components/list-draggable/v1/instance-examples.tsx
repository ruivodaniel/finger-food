import { ListDraggable } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance, type InstanceApi } from "../../../../lib/instance";

type Item = { id: string; title: string; children: Item[] };

const SEED: Item[] = [
  { id: "1", title: "Foundations", children: [
    { id: "1-1", title: "Slice separation", children: [] },
    { id: "1-2", title: "Owner of every page", children: [] },
  ] },
  { id: "2", title: "Versioning", children: [
    { id: "2-1", title: "What is versioned", children: [] },
    { id: "2-2", title: "History and restore", children: [] },
  ] },
  { id: "3", title: "Storage", children: [] },
];

/** the tree is the data: a drag writes the moved tree back */
const itemsSetter = (x: InstanceApi) => (x.bind("items") as { onChange: (v: Item[]) => void }).onChange;

function Demo({ id, dragPreview = true, nesting = true, disabled = false }: { id: string; dragPreview?: boolean; nesting?: boolean; disabled?: boolean }) {
  return (
    <Instance id={id} initial={{ data: { items: SEED } }}>
      {(x) => (
        <ListDraggable<Item>
          items={x.data.items as Item[]}
          onItemsChange={itemsSetter(x)}
          dragPreview={dragPreview}
          nesting={nesting}
          disabled={disabled}
          renderRow={(item, ctx) => (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {ctx.handle}
              <span>{ctx.path}</span>
              <span style={{ flex: 1 }}>{item.title}</span>
              {ctx.hasChildren && <button type="button" onClick={ctx.toggle} aria-label={ctx.expanded ? "Collapse" : "Expand"}>{ctx.expanded ? "−" : "+"}</button>}
            </div>
          )}
        />
      )}
    </Instance>
  );
}

export default function ListDraggableFixture() {
  return (
    <FixtureBody>
      <Row label="default: preview, nesting"><Demo id="default" /></Row>
      <Row label="no preview"><Demo id="no-preview" dragPreview={false} /></Row>
      <Row label="no nesting"><Demo id="no-nesting" nesting={false} /></Row>
      <Row label="disabled"><Demo id="disabled" disabled /></Row>
    </FixtureBody>
  );
}
