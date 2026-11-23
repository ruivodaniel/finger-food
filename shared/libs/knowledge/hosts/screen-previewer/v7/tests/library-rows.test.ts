// The rows of the UI library's elements (ui_data.json beside each element): no two UI documents share an id, and every UI snapshot points at a UI document that is there.
// What the UI rules find in the documents is the gate's (ui-rules.test.ts, through the check system), with its backlog.
import { describe, expect, it } from "vitest";
import type { UiData, UiSnapshot } from "@libs/knowledge/hosts/screen-previewer";

const rows = Object.values(import.meta.glob("../../../../../ui/web/{primitives,patterns}/**/ui_data.json", { eager: true, import: "default" })) as UiData[];
const snapshots = Object.values(import.meta.glob("../../../../../ui/web/{primitives,patterns}/**/ui_snapshot/*.json", { eager: true, import: "default" })) as UiSnapshot[];

describe("the rows of the library's elements", () => {
  it("there are some", () => expect(rows.length).toBeGreaterThan(0));
  it("no two UI documents have the same id", () => expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length));
  for (const s of snapshots) it(`the UI snapshot ${s.id} points at a UI document`, () => expect(rows.some((r) => r.id === s.uiDataId)).toBe(true));
});
