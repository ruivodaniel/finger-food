import { describe, expect, it } from "vitest";
import { buildUrl } from "../screen-previewer/ScreenPreviewer";
import { reader } from "./world";

const route = { id: "r", version: 1, surface: "web" as const, path: "/organizations/:organizationId/info", uiNodeId: "n" };

describe("buildUrl", () => {
  it("fills the route with the initial params; the rest is the query", async () => {
    const snapshot = { ...(await reader.uiSnapshot("s1")), initialParams: { organizationId: "abc123", page: "2" } };
    expect(buildUrl(snapshot, route)).toBe("/ui-snapshot/s1/organizations/abc123/info?page=2");
  });
  it("names a UI prototype by its own prefix, and the theme", async () => expect(buildUrl(await reader.uiPrototype("p1"), { ...route, path: "/organizations" }, "borro")).toBe("/ui-prototype/p1/organizations?_theme=borro"));
  it("names the mode of the theme", async () => expect(buildUrl(await reader.uiPrototype("p1"), { ...route, path: "/organizations" }, "borro@v2", "dark")).toBe("/ui-prototype/p1/organizations?_theme=borro%40v2&_mode=dark"));
  it("gives an error when the route names a value the row does not give", async () => { const prototype = await reader.uiPrototype("p1"); expect(() => buildUrl(prototype, route)).toThrow("names organizationId"); });
});
