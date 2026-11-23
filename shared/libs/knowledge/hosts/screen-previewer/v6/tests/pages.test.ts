// The UI documents of the screen previewer pattern follow the language of a UI document (the UI rules, through the check system): every read and every action is a request of the dictionary's shape.
import { describe, expect, it } from "vitest";
import { findingsIn } from "../../ui-system";
import type { UiData } from "@libs/knowledge/hosts/screen-previewer";

const rows = Object.values(import.meta.glob("../../../../../ui/web/patterns/component/screen-previewer/fixtures/ui_data/*.json", { eager: true, import: "default" })) as UiData[];
const found = await findingsIn(rows, ["language"]);

describe("the UI documents", () => {
  it("are the three pages, the two layouts they use, the title header and the shell", () => expect(rows.map((r) => r.name).sort()).toEqual(["organization-info", "organization-layout", "organization-members", "organizations-directory", "sidebar-shell", "standalone-layout", "title-header"]));
  for (const r of rows) it(`${r.name} follows the language`, () => expect(found[r.name]).toEqual([]));
});
