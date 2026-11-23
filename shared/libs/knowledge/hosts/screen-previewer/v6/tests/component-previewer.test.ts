// The component previewer: the address a component is shown alone at; what a page at that address mounts; the picture at the component's own width and height.
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { ComponentPreviewer, componentUrl, type ComponentPictureService } from "../component-previewer/ComponentPreviewer";
import { mountLive } from "../live-component/host";
import type { Doc, UiData } from "../model";
import { reader as world, RECORDED } from "./world";

const hello: Doc = { kind: "component", schemaVersion: 1, name: "hello", version: 1, params: ["name"], root: { type: "Text", props: { "data-testid": "hello", children: { concat: ["Hello ", { bind: "name" }] } } } } as unknown as Doc;
const UI: UiData = { id: "ui-hello", version: 1, uiNodeId: "node-hello", kind: "component", name: "hello", document: hello };
const reader = {
  ...world,
  uiSnapshot: async (id: string) => (id === "s-hello" ? { id, version: 1, worldId: "w", t: 0, uiDataId: "ui-hello", title: "Hello", initialParams: { name: "Ada" }, recordedRequests: RECORDED } : world.uiSnapshot(id)),
  uiData: async (id: string) => (id === "ui-hello" ? UI : world.uiData(id)),
};
const later = (ms = 30) => new Promise((r) => setTimeout(r, ms));

let root: Root | null = null, element: HTMLElement | null = null, unmount: (() => void) | null = null;
const place = () => { element = document.createElement("div"); document.body.appendChild(element); return element; };
afterEach(() => { root?.unmount(); root = null; unmount?.(); unmount = null; element?.remove(); element = null; window.history.replaceState(null, "", "/"); });
const draw = async (props: Partial<React.ComponentProps<typeof ComponentPreviewer>> & { id: string }) => { root = createRoot(place()); root.render(React.createElement(ComponentPreviewer, { reader, ...props })); await later(); await later(); };
const text = (testid: string) => element?.querySelector(`[data-testid="${testid}"]`)?.textContent;

describe("the address of a component", () => {
  it("is the one of its UI snapshot, with no path", () => expect(componentUrl("s-hello")).toBe("/ui-snapshot/s-hello"));
  it("names the theme", () => expect(componentUrl("s-hello", "borro")).toBe("/ui-snapshot/s-hello?_theme=borro"));
  it("names a version of the theme, and its mode", () => expect(componentUrl("s-hello", "borro@v1", "dark")).toBe("/ui-snapshot/s-hello?_theme=borro%40v1&_mode=dark"));
});

describe("a page at a live address", () => {
  it("mounts the live component when the UI document of the UI snapshot is a component", async () => {
    const m = await mountLive({ reader, element: place(), themeHrefs: () => [], url: "/ui-snapshot/s-hello" }); unmount = () => (m.liveComponent ?? m.liveScreen)!.unmount();
    await m.liveComponent!.settled();
    expect(m.liveScreen).toBeUndefined(); expect(text("hello")).toBe("Hello Ada");
  });
  it("gives the live component the theme and the mode the address names; both change with nothing reloaded", async () => {
    const asked: (string | undefined)[] = [];
    const m = await mountLive({ reader, element: place(), themeHrefs: (theme) => { asked.push(theme); return []; }, url: "/ui-snapshot/s-hello?_theme=borro%40v1&_mode=dark" }); unmount = () => { (m.liveComponent ?? m.liveScreen)!.unmount(); document.documentElement.removeAttribute("data-mode"); };
    expect([asked.at(-1), document.documentElement.getAttribute("data-mode")]).toEqual(["borro@v1", "dark"]);
    m.liveComponent!.setTheme("borro", "light");
    expect([asked.at(-1), document.documentElement.getAttribute("data-mode")]).toEqual(["borro", "light"]);
    m.liveComponent!.setTheme("borro");
    expect(document.documentElement.getAttribute("data-mode")).toBeNull();
  });
  it("mounts the live screen when it is a page", async () => {
    const m = await mountLive({ reader, element: place(), themeHrefs: () => [], url: "/ui-snapshot/s1" }); unmount = () => (m.liveComponent ?? m.liveScreen)!.unmount();
    expect(m.liveComponent).toBeUndefined(); expect(m.liveScreen).toBeDefined();
  });
});

describe("the component previewer", () => {
  it("live: a document of its own, at the address of the component", async () => { await draw({ id: "s-hello", mode: "live", theme: "borro" }); expect(element!.querySelector("iframe")?.getAttribute("src")).toBe("/ui-snapshot/s-hello?_theme=borro"); });
  it("picture: the picture, at the width and the height of the component", async () => {
    const pictureService: ComponentPictureService = { picture: async (id, theme) => ({ url: `/pictures/${id}-${theme}.png`, width: 240, height: 36 }) };
    await draw({ id: "s-hello", theme: "borro", pictureService });
    const img = element!.querySelector("img")!;
    expect([img.getAttribute("src"), img.getAttribute("width"), img.getAttribute("height")]).toEqual(["/pictures/s-hello-borro.png", "240", "36"]);
  });
  it("picture, with no picture service: says so, with a link to the live component", async () => { await draw({ id: "s-hello" }); expect(text("component-previewer-no-picture")).toContain("there is no picture service"); expect(element!.querySelector("a")?.getAttribute("href")).toBe("/ui-snapshot/s-hello"); });
  it("refuses a page: a page is shown in a screen previewer", async () => { await draw({ id: "s1", mode: "live" }); expect(text("component-previewer-problem")).toBe("the UI document list is a page: a page is shown in a screen previewer"); });
});
