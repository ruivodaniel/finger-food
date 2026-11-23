import { ListTree } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

type Item = { id: string; title: string; note?: string; children?: Item[] };

const SEED: Item[] = [
  { id: "mon-projet", title: "mon-projet", children: [
    { id: "package", title: "package.json" },
    { id: "public", title: "public", children: [{ id: "favicon", title: "favicon.ico" }] },
    { id: "readme", title: "README.md" },
    { id: "src", title: "src", children: [
      { id: "index", title: "index.js" },
      { id: "styles", title: "styles.css" },
    ] },
  ] },
  { id: "docs", title: "docs", children: [
    { id: "intro", title: "intro.md", note: "A longer entry: a row can hold anything, and the line beside it goes on through every row below the gap." },
    { id: "api", title: "api.md" },
  ] },
  { id: "license", title: "LICENSE" },
];

const node = (item: Item, ctx: { handle: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    {ctx.handle}
    <span style={{ flex: 1 }}>{item.title}{item.note && <><br /><small>{item.note}</small></>}</span>
  </div>
);

/** the tree and the chosen row are the data: a drag writes the moved tree, a click writes the row's id */
function Demo({ id, ...props }: { id: string } & Partial<React.ComponentProps<typeof ListTree>>) {
  return (
    <Instance id={id} initial={{ data: { items: SEED, selectedId: "readme" } }}>
      {(x) => {
        const items = x.data.items as Item[];
        const selectedId = x.data.selectedId as string | null;
        const setItems = (x.bind("items") as { onChange: (v: Item[]) => void }).onChange;
        const setSelectedId = (x.bind("selectedId") as { onChange: (v: string) => void }).onChange;
        return <ListTree<Item> items={items} onItemsChange={setItems} selectedId={selectedId} onSelect={(i) => setSelectedId(i.id)} renderNode={node} {...(props as object)} />;
      }}
    </Instance>
  );
}

export default function ListTreeFixture() {
  return (
    <FixtureBody>
      <Row label="lines · indent"><Demo id="lines-indent" lines /></Row>
      <Row label="lines · anchor top · tall rows"><Demo id="lines-anchor-top" lines anchor="top" /></Row>
      <Row label="indent only"><Demo id="indent-only" /></Row>
      <Row label="no indent (the caller turns depth into heading levels)"><Demo id="no-indent" indent={false} /></Row>
      <Row label="reorderable · lines"><Demo id="reorderable-lines" lines reorderable /></Row>
      <Row label="expand single (every level): opening a row closes its open siblings"><Demo id="expand-single" lines expand="single" /></Row>
      <Row label="expand per level: level 1 single, level 2 multiple"><Demo id="expand-per-level" lines expand={["single", "multiple"]} /></Row>
      <Row label="toggleOnClick (every level)"><Demo id="toggle-on-click" lines toggleOnClick /></Row>
      <Row label="toggleOnClick: level 1 only · expand single"><Demo id="toggle-level-1" lines toggleOnClick={[true, false]} expand="single" /></Row>
      <Row label="not collapsible"><Demo id="not-collapsible" lines collapsible={false} /></Row>
      <Row label="disabled"><Demo id="disabled" lines reorderable disabled /></Row>
    </FixtureBody>
  );
}
