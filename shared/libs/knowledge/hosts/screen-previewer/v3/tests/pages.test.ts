// The UI documents of the screen previewer pattern pass the validator of the UI as data library: every read and every action is a request of the dictionary's shape.
import { describe, expect, it } from "vitest";
import { validate } from "@libs/ui-data/validate";
import type { Doc, Registry } from "@libs/ui-data/types";
import type { UiData } from "@libs/knowledge/hosts/screen-previewer";

const rows = Object.values(import.meta.glob("../../../../../ui/web/patterns/component/screen-previewer/fixtures/ui_data/*.json", { eager: true, import: "default" })) as UiData[];
const registry: Registry = { pages: {}, components: {} };
for (const r of rows) { if (r.kind === "page") registry.pages[r.name] = r.document; else (registry.components[r.name] ??= {})[r.document.version] = r.document; }

describe("the UI documents", () => {
  it("are the three pages, the two layouts they use, the title header and the shell", () => expect(rows.map((r) => r.name).sort()).toEqual(["organization-info", "organization-layout", "organization-members", "organizations-directory", "sidebar-shell", "standalone-layout", "title-header"]));
  for (const r of rows) it(`${r.name} passes the validator`, () => expect(validate(r.document as Doc, registry, { CONTRACTS: {}, ACTIONS: {} })).toEqual([]));
});
