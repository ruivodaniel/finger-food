// A UI document names a component written as code by its name alone (the latest version comes) or by its name and a number (that version comes).
// The resolver looks only in the code registries it was handed; the live component draws what it gives.
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { createResolver, type CodeRegistry } from "../../../../../ui/ui-data/v2/resolve";
import { lockOf } from "../../../../../ui/ui-data/v2/lock";
import { DocumentScreen } from "../../../../../ui/ui-data/v2/runtime";
import type { Binding, Registry } from "../../../../../ui/ui-data/v2/types";
import { createRoot } from "react-dom/client";
import { createLiveComponent, type LiveComponent } from "../live-component/live-component";
import type { Doc, UiData } from "../model";
import { reader as world } from "./world";

const say = (what: string) => (p: Record<string, unknown>) => React.createElement("b", { "data-testid": p["data-testid"] }, what);
const library: CodeRegistry = { Greeting: { 1: { component: say("the first") }, 2: { component: say("the second") } }, Other: { 1: { component: say("other") } } };

describe("the resolver", () => {
  const r = createResolver([library]);
  it("gives the latest version when no number is asked", () => expect(r.resolve("Greeting")?.version).toBe(2));
  it("gives the version asked", () => expect(r.resolve("Greeting", 1)?.version).toBe(1));
  it("gives nothing for a version that is not there, and nothing for a name it was not handed", () => { expect(r.resolve("Greeting", 3)).toBeNull(); expect(r.resolve("Unknown")).toBeNull(); });
  it("says the versions there are of a name", () => expect(r.versions("Greeting")).toEqual([1, 2]));
  it("gives the version a lock keeps, when no number is asked", () => expect(createResolver([library], { Greeting: 1 }).resolve("Greeting")?.version).toBe(1));
  it("a name in two registries is the later one's", () => expect(createResolver([library, { Greeting: { 7: { component: say("a product's own") } } }]).resolve("Greeting")?.version).toBe(7));
});

const doc = (name: string, version?: number): Doc => ({ kind: "component", schemaVersion: 1, name, version: 1, root: { type: "Greeting", ...(version ? { version } : {}), props: { "data-testid": "g" } } } as unknown as Doc);
const DOCS: Record<string, Doc> = { latest: doc("latest"), pinned: doc("pinned", 1), missing: doc("missing", 9) };
const reader = {
  ...world,
  uiSnapshot: async (id: string) => (DOCS[id] ? { id, version: 1, worldId: "w", t: 0, uiDataId: id, recordedRequests: [] } : world.uiSnapshot(id)),
  uiData: async (id: string) => (DOCS[id] ? ({ id, version: 1, uiNodeId: "n-" + id, kind: "component", name: id, document: DOCS[id] } as UiData) : world.uiData(id)),
};
let live: LiveComponent | null = null, element: HTMLElement;
const draw = async (id: string, code?: CodeRegistry[]) => { element = document.createElement("div"); document.body.appendChild(element); live = createLiveComponent({ reader, element, themeHrefs: () => [], code }); await live.mount(id); await live.settled(); return element.textContent; };
afterEach(() => { live?.unmount(); live = null; element?.remove(); });

describe("a UI document, drawn", () => {
  it("names a component alone: the latest version is drawn", async () => expect(await draw("latest", [library])).toBe("the second"));
  it("names a component and a number: that version is drawn", async () => expect(await draw("pinned", [library])).toBe("the first"));
  it("names a version that is not there: it says so", async () => expect(await draw("missing", [library])).toContain("no Greeting version 9"));
  it("names a version with no code registry handed over: it says so", async () => expect(await draw("pinned")).toContain("no code registry was handed over"));
});

describe("the lock", () => {
  const page = { ...doc("page"), kind: "page", root: { type: "Stack", children: [{ type: "Greeting", props: { "data-testid": "g" } }, { type: "Other", version: 1 }, { use: { component: "inner", version: "latest" } }] } } as unknown as Doc;
  const inner = { ...doc("inner"), root: { type: "Greeting" } } as unknown as Doc;
  const reg: Registry = { pages: { page }, components: { inner: { 1: inner } } };
  it("keeps the version each name with no number was given; a name with a number says its own", () => expect(lockOf(reg, "page", (n) => createResolver([library]).resolve(n))!.codeVersions).toEqual({ Greeting: 2 }));
  it("with no resolver, it keeps none", () => expect(lockOf(reg, "page")!.codeVersions).toEqual({}));
  it("a document drawn with a lock takes the version it kept, though a later one is there", async () => {
    const later: CodeRegistry = { ...library, Greeting: { ...library.Greeting, 3: { component: say("the third") } } }, r = createResolver([later]);
    const binding = { Provider: ({ children }: { children: React.ReactNode }) => children, hosted: {}, useContract: () => undefined, useEnv: () => null, actions: {}, navigate: async () => {}, errText: String, useScopeKey: () => "", catalog: { CONTRACTS: {}, ACTIONS: {} }, resolve: (n: string, v?: number) => r.resolve(n, v) } as unknown as Binding;
    const show = async (codeLock: Record<string, number> | null) => { const el = document.createElement("div"); document.body.appendChild(el); const root = createRoot(el); root.render(React.createElement(DocumentScreen, { doc: doc("latest"), registry: { pages: {}, components: {} }, binding, codeLock })); await new Promise((ok) => setTimeout(ok, 30)); const text = el.textContent; root.unmount(); el.remove(); return text; };
    expect(await show(null)).toBe("the third");
    expect(await show({ Greeting: 2 })).toBe("the second");
  });
});
