import { TreeView } from "@libs/web-components";
import type { TreeNode } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

const NODES: TreeNode[] = [
  {
    id: "1",
    label: "Documents",
    children: [
      { id: "1-1", label: "Resume.pdf" },
      { id: "1-2", label: "Cover letter.docx" },
    ],
  },
  {
    id: "2",
    label: "Images",
    children: [
      { id: "2-1", label: "avatar.png" },
      { id: "2-2", label: "banner.jpg" },
    ],
  },
  { id: "3", label: "Notes.txt" },
];

/** one tree: its config (scale) and its data (the expanded and the selected ids) live in the instance */
const One = ({ id, scale }: { id: string; scale: "sm" | "md" | "lg" }) => (
  <Instance id={id} initial={{ config: { scale }, data: { expanded: [], selected: null } }}>
    {(x) => (
      <TreeView
        items={NODES}
        scale={x.config.scale}
        {...x.bind("expanded", "expanded", "onExpandedChange")}
        {...x.bind("selected", "selected", "onSelect")}
      />
    )}
  </Instance>
);

export default function TreeViewFixture() {
  return (
    <FixtureBody>
      <Row label="scale sm">
        <One id="scale-sm" scale="sm" />
      </Row>
      <Row label="scale md">
        <One id="scale-md" scale="md" />
      </Row>
      <Row label="scale lg">
        <One id="scale-lg" scale="lg" />
      </Row>
    </FixtureBody>
  );
}
