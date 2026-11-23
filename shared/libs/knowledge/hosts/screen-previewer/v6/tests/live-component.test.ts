// The live component: a UI snapshot whose UI document is a component, drawn alone, with the values the snapshot gives its params; its reads answered by the mock API;
// no router, so a navigation goes nowhere; a page is refused.
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { createLiveComponent, type LiveComponent } from "../live-component/live-component";
import type { Doc, UiData } from "../model";
import { reader as world, RECORDED } from "./world";

const greeting: Doc = {
  kind: "component", schemaVersion: 1, name: "greeting", version: 1, params: ["name"],
  data: { org: { source: "GET /organizations/:organizationId", params: { organizationId: "a" } } },
  root: { type: "Stack", children: [
    { type: "Text", props: { "data-testid": "hello", children: { concat: ["Hello ", { bind: "name" }] } } },
    { type: "Text", props: { "data-testid": "org", children: { bind: "data.org.name" } } },
    { type: "Text", props: { "data-testid": "go", href: "/organizations" }, on: { click: [{ navigate: { to: "/organizations" } }] } },
  ] },
} as unknown as Doc;
const UI: UiData = { id: "ui-greeting", version: 1, uiNodeId: "node-greeting", kind: "component", name: "greeting", document: greeting };
const reader = {
  ...world,
  uiSnapshot: async (id: string) => (id === "s-greeting" ? { id, version: 1, worldId: "w", t: 0, uiDataId: "ui-greeting", initialParams: { name: "Ada" }, initialStoreState: { session: "u-1" }, recordedRequests: RECORDED } : world.uiSnapshot(id)),
  uiData: async (id: string) => (id === "ui-greeting" ? UI : world.uiData(id)),
};

let live: LiveComponent | null = null, element: HTMLElement;
const start = async (id: string) => {
  element = document.createElement("div"); document.body.appendChild(element);
  live = createLiveComponent({ reader, element, themeHrefs: () => [] });
  await live.mount(id); await live.settled();
  return live;
};
afterEach(() => { live?.unmount(); live = null; element?.remove(); });
const text = (testid: string) => element.querySelector(`[data-testid="${testid}"]`)?.textContent;

describe("the live component", () => {
  it("draws the component with the values the UI snapshot gives its params", async () => { await start("s-greeting"); expect(text("hello")).toBe("Hello Ada"); });
  it("answers its reads through the mock API, from the world", async () => { await start("s-greeting"); expect(text("org")).toBe("Acme"); });
  it("names the UI snapshot and the store's values in the headers of a request", async () => { const l = await start("s-greeting"); expect(l.buildRequest("GET /organizations/:organizationId", { organizationId: "a" })).toEqual({ method: "GET", path: "/organizations/a", headers: { session: "u-1", uiSnapshot: "s-greeting" } }); });
  it("hugs what it draws, in a box of its own", async () => { await start("s-greeting"); expect((element.querySelector('[data-testid="live-component"]') as HTMLElement).style.width).toBe("fit-content"); });
  it("has no router: a navigation goes nowhere and the browser's URL stays", async () => {
    const l = await start("s-greeting"), before = window.location.href;
    (element.querySelector('[data-testid="go"]') as HTMLElement).click(); await l.settled();
    expect(window.location.href).toBe(before); expect(text("hello")).toBe("Hello Ada");
  });
  it("takes a padding: room around the component in its document; its size stays the component's", async () => {
    const l = await start("s-greeting");
    l.setPadding({ top: 40, right: 8, bottom: 120, left: 16 }); expect(element.style.padding).toBe("40px 8px 120px 16px");
    l.setPadding(null); expect(element.style.padding).toBe("");
  });
  it("draws a code component the app hosts, named by the document like any other; one it does not host is unknown", async () => {
    const hostedDoc = { ...greeting, name: "hosted", data: undefined, root: { type: "Badge2", props: { "data-testid": "hosted", label: "from the app" } } } as unknown as Doc;
    const withHosted = { ...reader, uiSnapshot: async (id: string) => (id === "s-hosted" ? { id, version: 1, worldId: "w", t: 0, uiDataId: "ui-hosted", recordedRequests: [] } : reader.uiSnapshot(id)), uiData: async (id: string) => (id === "ui-hosted" ? { ...UI, id, name: "hosted", document: hostedDoc } : reader.uiData(id)) };
    const mountWith = async (hosted?: Parameters<typeof createLiveComponent>[0]["hosted"]) => { element = document.createElement("div"); document.body.appendChild(element); live = createLiveComponent({ reader: withHosted, element, themeHrefs: () => [], hosted }); await live.mount("s-hosted"); await live.settled(); };
    await mountWith({ components: { Badge2: ({ label, ...p }: { label: string }) => React.createElement("b", p, label) } });
    expect(text("hosted")).toBe("from the app");
    live!.unmount(); element.remove();
    await mountWith();
    expect(element.textContent).toContain("unknown web component Badge2");
  });
  it("refuses a page: a page is shown in a live screen", async () => { await start("s1"); expect(text("live-component-error")).toBe("the UI document list is a page: a page is shown in a live screen"); });
});
