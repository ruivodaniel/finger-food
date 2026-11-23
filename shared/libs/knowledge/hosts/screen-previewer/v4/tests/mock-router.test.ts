import { beforeEach, describe, expect, it } from "vitest";
import { createMockRouter } from "../mock-router/mock-router";
import { createMockStore } from "../mock-store/mock-store";
import { recording } from "../reader";
import { build, fit, parse } from "../url";
import { reader } from "./world";

describe("the URL", () => {
  it("names the row, the real path, the page's query, the moment and the theme", () => expect(parse("http://localhost:8910/ui-prototype/p1/organizations/abc123/info?page=2&_t=1&_theme=borro")).toEqual({ kind: "ui-prototype", id: "p1", path: "/organizations/abc123/info", query: { page: "2" }, t: 1, theme: "borro" }));
  it("is written back the same", () => expect(build(parse("/ui-snapshot/s1/organizations?page=2&_theme=borro")!)).toBe("/ui-snapshot/s1/organizations?page=2&_theme=borro"));
  it("is not a live screen URL without a prefix and an id", () => { expect(parse("/organizations")).toBeNull(); expect(parse("/ui-prototype/")).toBeNull(); });
  it("fits a path to a route and gives the values of the path", async () => expect(fit(await reader.routes("web"), "/organizations/abc123/info")).toMatchObject({ route: { id: "r-info" }, values: { organizationId: "abc123" } }));
});

describe("the mock router", () => {
  beforeEach(() => window.history.replaceState(null, "", "/ui-prototype/p1/organizations?page=2&_theme=borro"));
  it("receives the URL: the UI document at the path, the values of the path, the query", async () => {
    const router = createMockRouter(reader);
    await router.receive(window.location.href);
    expect(router.current()).toMatchObject({ uiDocument: { name: "list" }, path: "/organizations", values: {}, query: { page: "2" } });
  });
  it("reads the documents the page uses as components", async () => expect((await createMockRouter(reader).matchRoute("/organizations/abc123/info")).components).toMatchObject({ frame: { 1: { name: "frame" } } }));
  it("gives the shell the route is under; a route with routes under it is not a page", async () => {
    const router = createMockRouter(reader);
    expect((await router.matchRoute("/organizations/abc123/info")).shells.map((s) => s.name)).toEqual(["shell"]);
    expect((await router.matchRoute("/organizations")).shells).toEqual([]);
    await expect(router.matchRoute("/")).rejects.toThrow("no route fits /");
  });
  it("navigates: writes the URL under the prefix, keeps the theme, matches the path", async () => {
    const router = createMockRouter(reader);
    await router.receive(window.location.href);
    await router.navigate("/organizations/abc123/info");
    expect(window.location.pathname + window.location.search).toBe("/ui-prototype/p1/organizations/abc123/info?_theme=borro");
    expect(router.current()).toMatchObject({ uiDocument: { name: "info" }, values: { organizationId: "abc123" }, query: {} });
  });
  it("writes a link with the prefix, and the theme the browser's URL has", async () => { const router = createMockRouter(reader); await router.receive("/ui-snapshot/s1/organizations"); expect(router.link("/organizations?page=3")).toBe("/ui-snapshot/s1/organizations?page=3&_theme=borro"); });
  it("gives an error when no route fits", async () => { await expect(createMockRouter(reader).receive("/ui-prototype/p1/nowhere")).rejects.toThrow("no route fits /nowhere"); });
});

describe("the mock store", () => {
  it("starts with the initial store state of the row the URL names", async () => {
    const store = createMockStore(reader);
    await store.start("/ui-prototype/p1/organizations");
    expect(store.all()).toEqual({ session: "u-1", activeOrganization: "o-1" });
    await store.start("/ui-snapshot/s1/organizations");
    expect(store.all()).toEqual({ session: "u-2" });
  });
  it("keeps what is written", async () => { const store = createMockStore(reader); await store.start("/ui-prototype/p1/organizations"); store.set("activeOrganization", "o-2"); expect(store.get("activeOrganization")).toBe("o-2"); });
});

describe("what was read", () => {
  it("is every row read through the reader, with the version it had", async () => {
    const data = recording(reader);
    await createMockRouter(data.reader).matchRoute("/organizations/abc123/info");
    await data.reader.rows("w", 1, "organization", ["b", "gone"]);
    expect(data.read()).toEqual(expect.arrayContaining([{ table: "route", id: "r-info", version: 1 }, { table: "ui_node", id: "node-info", version: 1 }, { table: "ui_data", id: "ui-info", version: 3 }, { table: "ui_data", id: "ui-frame", version: 2 }, { table: "organization", id: "b", version: 1 }]));
    expect(data.read().some((r) => r.id === "gone")).toBe(false);
  });
});
