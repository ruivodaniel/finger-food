// A small reader for the tests: two routes, one page that uses one component, one UI prototype and one UI snapshot, a world with two moments.
import type { DataReader } from "../reader";
import type { Doc, LivePlayStep, LivePlayUiEvent, RecordedRequest, Row, UiData, UiLivePlay } from "../model";

const doc = (kind: Doc["kind"], name: string, root: Doc["root"]): Doc => ({ kind, schemaVersion: 1, name, version: 1, root });
const UI: UiData[] = [
  { id: "ui-list", version: 1, uiNodeId: "node-list", kind: "page", name: "list", document: doc("page", "list", { type: "Stack" }) },
  { id: "ui-info", version: 3, uiNodeId: "node-info", kind: "page", name: "info", document: doc("page", "info", { use: { component: "frame", version: "latest" } }) },
  { id: "ui-frame", version: 2, uiNodeId: "node-frame", kind: "component", name: "frame", document: doc("component", "frame", { type: "Stack" }) },
  { id: "ui-shell", version: 1, uiNodeId: "node-shell", kind: "component", name: "shell", document: { ...doc("component", "shell", { type: "Slot", props: { name: "outlet" } }), slots: ["outlet"] } },
];
export const RECORDED: RecordedRequest[] = [
  { request: { method: "GET", path: "/organizations", query: { page: "1" }, headers: { activeOrganization: "o-1" } }, response: { status: 200, body: { rows: { table: "organization", ids: ["a", "b", "gone"] }, total: 2 } } },
  { request: { method: "GET", path: "/organizations", query: { page: "2" }, headers: { activeOrganization: "o-1" } }, response: { status: 200, body: { rows: { table: "organization", ids: [] }, total: 2 } } },
  { request: { method: "GET", path: "/organizations/a" }, response: { status: 200, body: { table: "organization", id: "a" } } },
  { request: { method: "GET", path: "/forbidden" }, response: { status: 403, body: { message: "not allowed" } } },
];
const AT: Record<number, Row[]> = { 0: [{ id: "a", name: "Acme", version: 0 }, { id: "b", name: "Borealis", version: 0 }], 1: [{ id: "a", name: "Acme", version: 0 }, { id: "b", name: "Borealis Group", version: 1 }] };
const base = { version: 1, worldId: "w", t: 0, initialStoreState: { session: "u-1", activeOrganization: "o-1" }, recordedRequests: RECORDED };

/** a live play over p1: a person, a click and a fill, an explanation, the moment moved, an act the live screen cannot do */
export const PLAY: UiLivePlay = { id: "lp1", version: 1, title: "A play", uiPrototypeId: "p1", stepOrder: ["st-who", "st-acts", "st-note", "st-moment", "st-hover"] };
export const STEPS: LivePlayStep[] = [
  { id: "st-moment", version: 1, uiLivePlayId: "lp1", kind: "actions", uiEventOrder: ["e-t", "e-again"] },
  { id: "st-who", version: 1, uiLivePlayId: "lp1", kind: "separator", separatorKind: "persona", worldUserId: "u-1" },
  { id: "st-acts", version: 1, uiLivePlayId: "lp1", kind: "actions", uiEventOrder: ["e-click", "e-fill", "e-open"] },
  { id: "st-note", version: 1, uiLivePlayId: "lp1", kind: "separator", separatorKind: "note", text: "Later" },
  { id: "st-hover", version: 1, uiLivePlayId: "lp1", kind: "actions", uiEventOrder: ["e-hover"] },
];
export const EVENTS: LivePlayUiEvent[] = [
  { id: "e-open", version: 1, livePlayStepId: "st-acts", act: "goto", url: "/organizations/a/info" },
  { id: "e-click", version: 1, livePlayStepId: "st-acts", act: "click", target: "next-btn" },
  { id: "e-fill", version: 1, livePlayStepId: "st-acts", act: "fill", target: "name-input", value: "Acme" },
  { id: "e-t", version: 1, livePlayStepId: "st-moment", act: "set_url_param", target: "_t", value: "1" },
  { id: "e-again", version: 1, livePlayStepId: "st-moment", act: "refetch" },
  { id: "e-hover", version: 1, livePlayStepId: "st-hover", act: "hover", target: "next-btn" },
];

export const reader: DataReader = {
  uiSnapshot: async (id) => { if (id !== "s1") throw new Error(`no UI snapshot ${id}`); return { ...base, id, uiDataId: "ui-list", initialStoreState: { session: "u-2" } }; },
  uiPrototype: async (id) => { if (id !== "p1") throw new Error(`no UI prototype ${id}`); return { ...base, id, title: "p", initialUiDataId: "ui-list" }; },
  routes: async () => [{ id: "r-list", version: 1, surface: "web", path: "/organizations", uiNodeId: "node-list" }, { id: "r-info", version: 1, surface: "web", path: "/organizations/:organizationId/info", uiNodeId: "node-info", parentId: "r-shell" }, { id: "r-shell", version: 1, surface: "web", path: "/", uiNodeId: "node-shell" }],
  uiNode: async (id) => ({ id, version: 1 }),
  uiData: async (id) => { const u = UI.find((x) => x.id === id); if (!u) throw new Error(`no UI document ${id}`); return u; },
  uiDataOfNode: async (uiNodeId) => UI.find((u) => u.uiNodeId === uiNodeId) ?? null,
  uiDataByName: async (name) => UI.filter((u) => u.name === name && u.kind === "component"),
  rows: async (_w, t, table, ids) => (table === "user_profile" ? ids.map((id) => (id === "u-1" ? { userId: "u-1", name: "Ada Lovelace", image: null, version: 0 } : null)) : ids.map((id) => AT[t].find((r) => r.id === id) ?? null)),
  livePlays: async (uiPrototypeId) => (uiPrototypeId === "p1" ? [PLAY] : []),
  livePlay: async (id) => { if (id !== "lp1") throw new Error(`no live play ${id}`); return PLAY; },
  livePlaySteps: async (uiLivePlayId) => STEPS.filter((s) => s.uiLivePlayId === uiLivePlayId),
  livePlayUiEvents: async (livePlayStepId) => EVENTS.filter((e) => e.livePlayStepId === livePlayStepId),
};
