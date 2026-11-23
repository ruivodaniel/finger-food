// THE LIVE COMPONENT: the live screen without the browser. It is given a UI snapshot whose UI document is a component, asks the translator to draw that document alone,
// and sends what the component does to the mocks: a read or an action to the mock API, a store read or write to the mock store. It reads no data: the mocks read their own.
// Whoever places it can give it a padding: room around the component, inside its document, for what the component opens beside itself. It is set, never guessed.
// The two differences from the live screen:
//   no browser and no router   it has no URL and never touches the browser's; a link or a navigation in the component goes nowhere, because nothing routes it
//   it hugs                    its size is the size of what is drawn; whoever places it reads `size` (or listens with `onSize`) and decides where it goes
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Binding, Doc, Registry } from "../../../../../ui/ui-data/v2/types";
import { toRequest } from "../../../../../ui/ui-data/v2/request";
import { DocumentScreen } from "../../../../../ui/ui-data/v2/runtime";
import { createResolver, type CodeRegistry } from "../../../../../ui/ui-data/v2/resolve";
import type { ApiRequest } from "../model";
import { recording, type DataReader, type Read } from "../reader";
import { createMockApi, HEADER } from "../mock-api/mock-api";
import { createMockStore } from "../mock-store/mock-store";
import { build } from "../url";
import { createAnswers } from "../live-screen/answers";
import { createGestures, type Gestures } from "../live-screen/gestures";
import type { Hosted } from "../live-screen/live-screen";

type Values = Record<string, unknown>;
export type Size = { width: number; height: number };
/** room around the component, in px, for what it opens beside itself (a tooltip, a dropdown, the list of a select) */
export type Padding = { top: number; right: number; bottom: number; left: number };

export interface LiveComponent {
  /** reads the UI snapshot, its UI document and the documents it uses; asks the translator to draw it with the snapshot's initial params; shows the component */
  mount(uiSnapshotId: string, theme?: string, themeMode?: string): Promise<void>;
  /** the theme (`<name>`, or `<name>@<version>`) and its mode, changed while the component is shown. Nothing reloads */
  setTheme(theme?: string, themeMode?: string): void;
  /** builds the request, sends it to the mock API; gives the body of the response */
  readSource(source: string, params: Values): Promise<unknown>;
  runAction(action: string, args: Values): Promise<unknown>;
  /** the request. Its headers: the id of the UI snapshot, the mock store's values */
  buildRequest(line: string, values: Values): ApiRequest;
  readStore(key: string): unknown;
  writeStore(key: string, value: unknown): void;
  /** a person's gestures on the component, each one thing */
  gestures: Gestures;
  /** the component sends its requests again */
  refetch(): void;
  /** every row read through the data since mount, with the version it had */
  whatWasRead(): Read[];
  /** resolves when the component has every answer it asked for */
  settled(): Promise<void>;
  /** room around the component, inside its document: what it opens has that room to be drawn in. Set by whoever places it; none by default */
  setPadding(padding: Padding | null): void;
  /** the size of what is drawn, without the padding */
  size(): Size;
  /** tells every change of that size; gives back how to stop */
  onSize(listener: (size: Size) => void): () => void;
  unmount(): void;
}

const THEME_LINK = "live-component-theme";

/** every component a document names, in its nodes and in the nodes its props hold */
const used = (doc: Doc): string[] => {
  const out = new Set<string>();
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    const use = (v as { use?: { component?: unknown } }).use;
    if (use && typeof use.component === "string") out.add(use.component);
    Object.values(v).forEach(walk);
  };
  walk(doc.root);
  return [...out];
};

export function createLiveComponent({ reader: given, element, themeHrefs, hosted, code }: {
  reader: DataReader;
  /** where the component is drawn */
  element: HTMLElement;
  /** the stylesheets of a theme (its fonts, its tokens), named `<name>` (its last version) or `<name>@<version>`; no name = the theme a component has when none is named */
  themeHrefs: (theme: string | undefined) => string[];
  /** the components that are code and not of the UI library, which a UI document may name: the app that mounts gives them, once, each with what it takes and gives.
   *  The UI as data engine knows only the UI library */
  hosted?: Hosted;
  /** the code registries of the libraries the app was built with: a UI document names a component by its name (the latest version) or by its name and a number.
   *  The translator finds a component only in what is handed here */
  code?: CodeRegistry[];
}): LiveComponent {
  const data = recording(given);
  const resolver = code?.length ? createResolver(code) : null;
  const store = createMockStore(data.reader), api = createMockApi(data.reader);
  let root: Root | null = null, version = 0, failure: string | null = null;
  let id: string | null = null, current: { doc: Doc; components: Registry["components"]; args: Values } | null = null;
  let box: HTMLElement | null = null, watch: ResizeObserver | null = null;
  const heard = new Set<() => void>(), sized = new Set<(size: Size) => void>();
  const redraw = () => { version++; heard.forEach((f) => f()); };

  const theme = (name: string | undefined, mode?: string) => {
    // the mode of the theme, on the document: the theme's CSS reads it
    if (mode) document.documentElement.setAttribute("data-mode", mode); else document.documentElement.removeAttribute("data-mode");
    const hrefs = themeHrefs(name), links = [...document.head.querySelectorAll<HTMLLinkElement>(`link[data-${THEME_LINK}]`)];
    if (links.length === hrefs.length && links.every((l, i) => l.getAttribute("href") === hrefs[i])) return;
    links.forEach((l) => l.remove());
    for (const href of hrefs) { const link = document.createElement("link"); link.rel = "stylesheet"; link.setAttribute(`data-${THEME_LINK}`, ""); link.setAttribute("href", href); document.head.appendChild(link); }
  };
  /** the documents a document uses as components, and the ones those use */
  const components = async (doc: Doc, into: Registry["components"] = {}): Promise<Registry["components"]> => {
    for (const name of used(doc)) {
      if (into[name]) continue;
      const versions = await data.reader.uiDataByName(name);
      if (!versions.length) throw new Error(`no UI document named ${name}`);
      into[name] = Object.fromEntries(versions.map((u) => [u.document.version, u.document]));
      for (const u of versions) await components(u.document, into);
    }
    return into;
  };
  const size = (): Size => { const r = box?.getBoundingClientRect(); return { width: r?.width ?? 0, height: r?.height ?? 0 }; };
  const self: LiveComponent = {
    async mount(uiSnapshotId, themeName, themeMode) {
      id = uiSnapshotId; current = null;
      theme(themeName, themeMode);
      answers.forget(); failure = null;
      try {
        const row = await data.reader.uiSnapshot(uiSnapshotId), uiData = await data.reader.uiData(row.uiDataId);
        if (uiData.kind !== "component") throw new Error(`the UI document ${uiData.name} is a page: a page is shown in a live screen`);
        // the mock store takes the id of the UI snapshot from a URL: the one a UI snapshot has, with no path
        await store.start(build({ kind: "ui-snapshot", id: uiSnapshotId, path: "/", query: {} }));
        current = { doc: uiData.document, components: await components(uiData.document), args: { ...(row.initialParams ?? {}) } };
      } catch (e) { failure = e instanceof Error ? e.message : String(e); }
      if (!root) { root = createRoot(element); root.render(<Component />); }
      redraw();
    },
    async readSource(source, params) {
      const answer = await api.handle(self.buildRequest(source, params));
      if (answer.warning) console.warn(answer.warning);
      return answer.body;
    },
    async runAction(action, args) {
      const answer = await api.handle(self.buildRequest(action, args));
      if (answer.warning) console.warn(answer.warning);
      return answer.body;
    },
    buildRequest(line, values) {
      if (!id) throw new Error("no UI snapshot is mounted");
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(store.all())) if (typeof v === "string" || typeof v === "number") headers[k] = String(v);
      headers[HEADER.uiSnapshot] = id;
      return { ...toRequest(line, values), headers };
    },
    setTheme: (themeName, themeMode) => theme(themeName, themeMode),
    setPadding(padding) { element.style.padding = padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : ""; },
    readStore: (key) => store.get(key),
    writeStore(key, value) { store.set(key, value); redraw(); },
    gestures: createGestures(document),
    refetch() { answers.again(); },
    whatWasRead: () => data.read(),
    async settled() { for (let i = 0; i < 3; i++) { await new Promise((r) => setTimeout(r, 20)); await answers.settled(); } },
    size,
    onSize(listener) { sized.add(listener); return () => { sized.delete(listener); }; },
    unmount() { watch?.disconnect(); watch = null; box = null; root?.unmount(); root = null; heard.clear(); sized.clear(); },
  };

  const answers = createAnswers((source, params) => self.readSource(source, params), redraw);

  const useVersion = () => React.useSyncExternalStore((f) => { heard.add(f); return () => { heard.delete(f); }; }, () => version);
  /** what the translator is given: how a component's read, action and store write are done */
  const binding: Binding = {
    Provider: ({ children }) => <>{children}</>,
    hosted: hosted?.components ?? {},
    prims: hosted?.prims,
    resolve: resolver ? (name, version) => resolver.resolve(name, version) : undefined,
    useContract: (source, params, enabled) => { useVersion(); return enabled ? answers.read(source, params) : undefined; },
    status: (source, params) => answers.status(source, params),
    useEnv: () => null,
    actions: new Proxy({} as Binding["actions"], { get: (_t, action: string) => (_env: unknown, args: Values) => self.runAction(action, args) }),
    // there is no router: a navigation goes nowhere
    navigate: async () => {},
    setStorage: (key, value) => self.writeStore(key, value),
    errText: (e) => (e instanceof Error ? e.message : String(e)),
    // a component starts over when the active organization changes: the product's rule
    useScopeKey: () => { useVersion(); return String(store.get("activeOrganization") ?? ""); },
    catalog: { CONTRACTS: {}, ACTIONS: {} },
  };

  /** the box that hugs the component: as wide and as high as what is drawn, never wider than the place it was given */
  const hug = (el: HTMLDivElement | null) => {
    watch?.disconnect(); watch = null; box = el;
    if (!el || typeof ResizeObserver === "undefined") return;
    watch = new ResizeObserver(() => { const s = size(); sized.forEach((f) => f(s)); });
    watch.observe(el);
  };

  function Component() {
    useVersion();
    if (failure) return <pre data-testid="live-component-error" style={{ padding: 16, whiteSpace: "pre-wrap" }}>{failure}</pre>;
    if (!current) return null;
    const { doc, components: used, args } = current;
    return (
      <div ref={hug} data-testid="live-component" style={{ width: "fit-content", maxWidth: "100%" }}>
        <DocumentScreen key={doc.name} doc={doc} registry={{ pages: {}, components: used }} binding={binding} args={args} />
      </div>
    );
  }

  return self;
}
