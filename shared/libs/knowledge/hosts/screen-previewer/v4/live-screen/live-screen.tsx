// THE LIVE SCREEN: a page of the product, running at its URL. It asks the mock router which UI document is at the URL, asks the translator to draw it, and
// sends what the page does to the mocks: a read or an action to the mock API, a navigation to the mock router, a store read or write to the mock store.
// It reads no data: the three mocks read their own.
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Binding, Doc, Prim } from "@libs/ui-data/types";
import { toRequest } from "@libs/ui-data/request";
import { DocumentScreen } from "@libs/ui-data/runtime";
import type { ApiRequest } from "../model";
import { recording, type DataReader, type Read } from "../reader";
import { createMockApi, HEADER } from "../mock-api/mock-api";
import { createMockRouter, OUTLET, type Current } from "../mock-router/mock-router";
import { createMockStore } from "../mock-store/mock-store";
import { build, parse } from "../url";
import { buildUrl, locateSnapshot } from "../locate";
import { createAnswers } from "./answers";
import { createGestures, type Gestures } from "./gestures";

type Values = Record<string, unknown>;
/** components a UI document may name beside the UI library's: the code, and what each takes and gives */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Hosted = { components: Record<string, React.ComponentType<any>>; prims?: Record<string, Prim> };

export interface LiveScreen {
  /** asks the mock router which UI document is at that URL, asks the translator to draw it, shows the screen */
  mount(url: string): Promise<void>;
  /** builds the request, sends it to the mock API; gives the body of the response */
  readSource(source: string, params: Values): Promise<unknown>;
  runAction(action: string, args: Values): Promise<unknown>;
  /** the request. Its headers: the id of the UI snapshot or UI prototype, the moment when the URL has _t, the mock store's values */
  buildRequest(line: string, values: Values): ApiRequest;
  /** asks the mock router to go to a real path */
  navigate(path: string): Promise<void>;
  readStore(key: string): unknown;
  writeStore(key: string, value: unknown): void;
  /** a person's gestures on the page, each one thing; the player composes them into acts */
  gestures: Gestures;
  /** `_t`: the moment · `_theme`: the theme (`<name>`, or `<name>@<version>`) · `_mode`: the mode of the theme. Writes it in the URL. Nothing reloads */
  setUrlParam(name: "_t" | "_theme" | "_mode", value: string): void;
  /** the page sends its requests again */
  refetch(): void;
  /** every row read through the data since mount, with the version it had */
  whatWasRead(): Read[];
  /** resolves when the page has every answer it asked for */
  settled(): Promise<void>;
  unmount(): void;
}

const THEME_LINK = "live-screen-theme";

export function createLiveScreen({ reader: given, element, themeHrefs, hosted }: {
  reader: DataReader;
  /** where the screen is drawn */
  element: HTMLElement;
  /** the stylesheets of a theme (its fonts, its tokens), named `<name>` (its last version) or `<name>@<version>`; no name = the theme a screen has when its URL names none */
  themeHrefs: (theme: string | undefined) => string[];
  /** the components that are code and not of the UI library, which a UI document may name: the app that mounts gives them, once, each with what it takes and gives.
   *  The UI as data engine knows only the UI library */
  hosted?: Hosted;
}): LiveScreen {
  const data = recording(given);
  const router = createMockRouter(data.reader), store = createMockStore(data.reader), api = createMockApi(data.reader);
  let root: Root | null = null, version = 0, failure: string | null = null;
  const heard = new Set<() => void>();
  const redraw = () => { version++; heard.forEach((f) => f()); };
  const here = () => parse(window.location.pathname + window.location.search);

  const theme = () => {
    // the mode of the theme the URL names, on the document: the theme's CSS reads it
    const mode = here()?.mode;
    if (mode) document.documentElement.setAttribute("data-mode", mode); else document.documentElement.removeAttribute("data-mode");
    const hrefs = themeHrefs(here()?.theme), links = [...document.head.querySelectorAll<HTMLLinkElement>(`link[data-${THEME_LINK}]`)];
    if (links.length === hrefs.length && links.every((l, i) => l.getAttribute("href") === hrefs[i])) return;
    links.forEach((l) => l.remove());
    for (const href of hrefs) { const link = document.createElement("link"); link.rel = "stylesheet"; link.setAttribute(`data-${THEME_LINK}`, ""); link.setAttribute("href", href); document.head.appendChild(link); }
  };
  const self: LiveScreen = {
    async mount(url) {
      let to = url.replace(/^[a-z]+:\/\/[^/]+/i, "");
      if (to !== window.location.pathname + window.location.search) window.history.pushState(null, "", to);
      // a URL that names a UI snapshot and no path: the UI snapshot's own URL (its route filled with its initial params)
      const named = parse(to);
      if (named?.kind === "ui-snapshot" && named.path === "/") {
        try {
          const { row, route } = await locateSnapshot(data.reader, named.id), own = parse(buildUrl(row, route, named.theme, named.mode))!;
          to = build({ ...own, ...(named.t !== undefined ? { t: named.t } : {}) });
          window.history.replaceState(null, "", to);
        } catch { /* the mock router says what is wrong with the URL as it is */ }
      }
      theme();
      answers.forget(); failure = null;
      try { await Promise.all([router.receive(to), store.start(to)]); } catch (e) { failure = e instanceof Error ? e.message : String(e); }
      if (!root) { root = createRoot(element); root.render(<Screen />); }
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
      const p = here();
      if (!p) throw new Error("the URL names no UI snapshot and no UI prototype");
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(store.all())) if (typeof v === "string" || typeof v === "number") headers[k] = String(v);
      headers[p.kind === "ui-prototype" ? HEADER.uiPrototype : HEADER.uiSnapshot] = p.id;
      if (p.t !== undefined) headers[HEADER.moment] = String(p.t);
      return { ...toRequest(line, values), headers };
    },
    async navigate(path) {
      try { await router.navigate(path); failure = null; } catch (e) { failure = e instanceof Error ? e.message : String(e); }
      redraw();
    },
    readStore: (key) => store.get(key),
    writeStore(key, value) { store.set(key, value); redraw(); },
    gestures: createGestures(document),
    setUrlParam(name, value) {
      const p = here();
      if (!p) return;
      if (name === "_t") { if (value === "") delete p.t; else p.t = Number(value); }
      else if (name === "_mode") { if (value === "") delete p.mode; else p.mode = value; }
      else if (value === "") delete p.theme; else p.theme = value;
      window.history.replaceState(null, "", build(p));
      if (name !== "_t") theme();
    },
    refetch() { answers.again(); },
    whatWasRead: () => data.read(),
    async settled() { for (let i = 0; i < 3; i++) { await new Promise((r) => setTimeout(r, 20)); await answers.settled(); } },
    unmount() { window.removeEventListener("popstate", back); root?.unmount(); root = null; heard.clear(); },
  };

  const answers = createAnswers((source, params) => self.readSource(source, params), redraw);
  // the browser's back and forward: the URL has changed, the router receives it
  const back = () => { void router.receive(window.location.pathname + window.location.search).then(() => { failure = null; }, (e: unknown) => { failure = e instanceof Error ? e.message : String(e); }).finally(() => { theme(); redraw(); }); };
  window.addEventListener("popstate", back);

  const useVersion = () => React.useSyncExternalStore((f) => { heard.add(f); return () => { heard.delete(f); }; }, () => version);
  /** what the translator is given: how a page's read, action, navigation and store write are done */
  const binding: Binding = {
    Provider: ({ children }) => <>{children}</>,
    hosted: hosted?.components ?? {},
    prims: hosted?.prims,
    useContract: (source, params, enabled) => { useVersion(); return enabled ? answers.read(source, params) : undefined; },
    status: (source, params) => answers.status(source, params),
    useEnv: () => null,
    actions: new Proxy({} as Binding["actions"], { get: (_t, action: string) => (_env: unknown, args: Values) => self.runAction(action, args) }),
    navigate: (_env, to) => self.navigate(to),
    setStorage: (key, value) => self.writeStore(key, value),
    errText: (e) => (e instanceof Error ? e.message : String(e)),
    // a page starts over when the active organization changes: the product's rule
    useScopeKey: () => { useVersion(); return String(store.get("activeOrganization") ?? ""); },
    catalog: { CONTRACTS: {}, ACTIONS: {} },
  };

  /** the page as it is drawn: in the outlet of each shell its route is under (the shell is told the path); with no shell, in the library's empty one */
  const placed = new WeakMap<Current, Doc>();
  const place = (c: Current): Doc => {
    let doc = placed.get(c);
    if (!doc) {
      let root: Doc["root"] = c.shells.length ? c.uiDocument.root : { type: "ShellNone", children: [c.uiDocument.root] };
      for (const shell of [...c.shells].reverse()) root = { use: { component: shell.name, version: shell.version }, args: (shell.params ?? []).includes("path") ? { path: c.path } : {}, slots: { [OUTLET]: [root] } };
      placed.set(c, (doc = { ...c.uiDocument, root }));
    }
    return doc;
  };

  function Screen() {
    useVersion();
    const c = router.current();
    if (failure) return <pre data-testid="live-screen-error" style={{ padding: 16, whiteSpace: "pre-wrap" }}>{failure}</pre>;
    if (!c) return null;
    // the page's params: the values of the path, and the query
    const args = { ...c.query, ...c.values };
    const doc = place(c);
    return <DocumentScreen key={doc.name} doc={doc} registry={{ pages: { [doc.name]: doc }, components: c.components }} binding={binding} args={args} />;
  }

  return self;
}
