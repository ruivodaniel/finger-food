import { describe, expect, it } from "vitest";
import { createMockApi, fillResponse, findRecorded, MockApiError } from "../mock-api/mock-api";
import { reader, RECORDED } from "./world";

const H = { uiPrototype: "p1", activeOrganization: "o-1" };

describe("findRecorded", () => {
  it("gives the same request", () => expect(findRecorded(RECORDED, { method: "GET", path: "/organizations", query: { page: "2" }, headers: { activeOrganization: "o-1" } })).toMatchObject({ same: true, recorded: RECORDED[1] }));
  it("else gives the closest on the same method and path, and says what did not match", () => {
    expect(findRecorded(RECORDED, { method: "GET", path: "/organizations", query: { page: "34" }, headers: { activeOrganization: "o-1" } })).toMatchObject({ same: false, unmatched: ["page=34"] });
    expect(findRecorded(RECORDED, { method: "GET", path: "/organizations", query: { page: "2" }, headers: { activeOrganization: "o-9" } })).toMatchObject({ same: false, recorded: RECORDED[1], unmatched: ["header activeOrganization=o-9"] });
  });
  it("else gives nothing", () => { expect(findRecorded(RECORDED, { method: "GET", path: "/users" })).toBeNull(); expect(findRecorded(RECORDED, { method: "POST", path: "/organizations" })).toBeNull(); });
  it("does not compare a header the recording does not name", () => expect(findRecorded(RECORDED, { method: "GET", path: "/organizations/a", headers: { anything: "x" } })?.same).toBe(true));
});

describe("fillResponse", () => {
  const rows = new Map([["organization", new Map([["a", { id: "a", version: 0 }], ["gone", null]])]]);
  it("puts the rows in place of { table, ids }, in order, without the ones the world does not have", () => expect(fillResponse({ rows: { table: "organization", ids: ["a", "gone"] }, total: 2 }, rows)).toEqual({ rows: [{ id: "a", version: 0 }], total: 2 }));
  it("puts one row in place of { table, id }, or null", () => expect(fillResponse([{ org: { table: "organization", id: "a" } }, { table: "organization", id: "gone" }], rows)).toEqual([{ org: { id: "a", version: 0 } }, null]));
});

describe("the mock API", () => {
  const api = createMockApi(reader);
  it("answers with the world's rows at the row's own moment", async () => expect(await api.handle({ method: "GET", path: "/organizations", query: { page: "1" }, headers: H })).toEqual({ status: 200, body: { rows: [{ id: "a", name: "Acme", version: 0 }, { id: "b", name: "Borealis", version: 0 }], total: 2 } }));
  it("answers at the moment the header t names", async () => expect(((await api.handle({ method: "GET", path: "/organizations", query: { page: "1" }, headers: { ...H, t: "1" } })).body as { rows: { name: string }[] }).rows[1].name).toBe("Borealis Group"));
  it("answers with the closest recorded request, with a warning", async () => expect((await api.handle({ method: "GET", path: "/organizations", query: { page: "1", search: "bo" }, headers: H })).warning).toContain("not matched: search=bo"));
  it("gives an error for a request that was not recorded", async () => { await expect(api.handle({ method: "GET", path: "/users", headers: H })).rejects.toThrow("no recorded request for GET /users"); });
  it("gives the recorded error", async () => { await expect(api.handle({ method: "GET", path: "/forbidden", headers: H })).rejects.toMatchObject({ status: 403, message: "not allowed" }); });
  it("gives an error when the request names no UI snapshot and no UI prototype", async () => { await expect(api.handle({ method: "GET", path: "/organizations" })).rejects.toBeInstanceOf(MockApiError); });
  it("reads the UI snapshot when the request names one", async () => expect((await api.whoAsks({ uiSnapshot: "s1", t: "1" })).moment).toBe(1));
});
