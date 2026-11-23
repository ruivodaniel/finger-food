// A meteor as a live document: its changes by field, and what it refuses. The service behind it is a stub.
import { describe, expect, it } from "vitest";
import { createMeteorLiveDocument } from "./meteor-live-document";

const live = createMeteorLiveDocument({ canAccess: async () => true, getLiveDocument: async () => ({ document: fields, head: "h" }), saveLiveDocument: async () => "h2", getTitles: async () => new Map() });
const fields = { name: "Ceres", description: null, diameterKm: "940", discoveredAt: null };
let seq = 0;
const newOpId = () => `op-${++seq}`;

describe("a meteor as a live document", () => {
  it("a change sets one field, by name; a path it doesn't know is ignored", () => {
    expect(live.applyChanges(fields, [{ opId: "o1", path: ["fields", "description"], after: "dwarf planet" }, { opId: "o2", path: ["fields", "status"], after: "published" }]))
      .toEqual({ ...fields, description: "dwarf planet" });
    expect(live.applyChanges(fields, [{ opId: "o3", path: ["fields", "diameterKm"] }])).toEqual({ ...fields, diameterKm: null });
  });

  it("the diff is one change per field that differs, and applying it gives the other", () => {
    const next = { ...fields, name: "Ceres I", discoveredAt: "1801-01-01" };
    const changes = live.diff(fields, next, newOpId);
    expect(changes.map((change) => change.path)).toEqual([["fields", "name"], ["fields", "discoveredAt"]]);
    expect(live.applyChanges(fields, changes)).toEqual(next);
  });

  it("a change still holds while its field is what it says it was", () => {
    expect(live.stillHolds(fields, { opId: "o1", path: ["fields", "name"], before: "Ceres", after: "x" })).toBe(true);
    expect(live.stillHolds(fields, { opId: "o2", path: ["fields", "name"], before: "Vesta", after: "x" })).toBe(false);
    expect(live.stillHolds(fields, { opId: "o3", path: ["fields", "description"], before: null, after: "x" })).toBe(true);
  });

  it("refuses what the form refuses: a meteor needs a name", async () => {
    expect(await live.findRefusal("m1", fields, fields)).toBeNull();
    expect(await live.findRefusal("m1", fields, { ...fields, name: "" })).toMatch(/^name: /);
  });

  it("nobody asking may do nothing", async () => {
    expect(await live.access(undefined, "m1", "read")).toBe(false);
  });
});
