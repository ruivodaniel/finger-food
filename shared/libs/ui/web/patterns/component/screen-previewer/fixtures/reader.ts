// THE DATA READER OVER JSON FILES: the rows of the canonical ERD, one file per table, beside this file. It stands in for the database and for nothing else:
// it finds rows by id and gives a world's table at a moment (its mutations up to that moment, in order). It knows the primary key of a table, as a database does.
import type { DataReader, LivePlayStep, LivePlayUiEvent, Route, Row, UiData, UiLivePlay, UiNode, UiPrototype, UiSnapshot } from "@libs/knowledge/hosts/screen-previewer";
import livePlays from "./ui_live_play.json";
import steps from "./live_play_step.json";
import uiEvents from "./live_play_ui_event.json";
import routes from "./route.json";
import nodes from "./ui_node.json";
import prototypes from "./ui_prototype.json";
import snapshots from "./ui_snapshot.json";
import mutations from "./world_mutation.json";

const uiData = Object.values(import.meta.glob("./ui_data/*.json", { eager: true, import: "default" })) as UiData[];

type Mutation = { worldId: string; t: number; op: "insert" | "update" | "delete"; table: string; row?: Record<string, unknown>; where?: Record<string, unknown>; set?: Record<string, unknown> };
/** the primary key of a table that is not `id` */
const PRIMARY_KEY: Record<string, string> = { user_profile: "userId" };
const one = <T extends { id: string }>(rows: T[], id: string, what: string): T => { const r = rows.find((x) => x.id === id); if (!r) throw new Error(`no ${what} ${id}`); return r; };
const holds = (row: Record<string, unknown>, where: Record<string, unknown> = {}) => Object.entries(where).every(([k, v]) => row[k] === v);

/** a table of a world at a moment. A row's version is the moment of the last mutation that wrote it */
function tableAt(worldId: string, t: number, table: string): Row[] {
  let rows: Row[] = [];
  for (const m of (mutations as Mutation[]).filter((x) => x.worldId === worldId && x.table === table && x.t <= t).sort((a, b) => a.t - b.t)) {
    if (m.op === "insert" && m.row) rows.push({ ...m.row, version: m.t });
    else if (m.op === "update") rows = rows.map((r) => (holds(r, m.where) ? { ...r, ...m.set, version: m.t } : r));
    else if (m.op === "delete") rows = rows.filter((r) => !holds(r, m.where));
  }
  return rows;
}

export const reader: DataReader = {
  uiSnapshot: async (id) => one(snapshots as unknown as UiSnapshot[], id, "UI snapshot"),
  uiPrototype: async (id) => one(prototypes as unknown as UiPrototype[], id, "UI prototype"),
  routes: async (surface) => (routes as Route[]).filter((r) => r.surface === surface),
  uiNode: async (id) => one(nodes as UiNode[], id, "UI node"),
  uiData: async (id) => one(uiData, id, "UI document"),
  uiDataOfNode: async (uiNodeId) => uiData.find((u) => u.uiNodeId === uiNodeId) ?? null,
  uiDataByName: async (name) => uiData.filter((u) => u.name === name && u.kind === "component"),
  livePlays: async (uiPrototypeId) => (livePlays as UiLivePlay[]).filter((p) => p.uiPrototypeId === uiPrototypeId),
  livePlay: async (id) => one(livePlays as UiLivePlay[], id, "live play"),
  livePlaySteps: async (uiLivePlayId) => (steps as LivePlayStep[]).filter((s) => s.uiLivePlayId === uiLivePlayId),
  livePlayUiEvents: async (livePlayStepId) => (uiEvents as LivePlayUiEvent[]).filter((e) => e.livePlayStepId === livePlayStepId),
  rows: async (worldId, t, table, ids) => { const key = PRIMARY_KEY[table] ?? "id", rows = tableAt(worldId, t, table); return ids.map((id) => rows.find((r) => r[key] === id) ?? null); },
};
