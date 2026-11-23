// THE DATA READER: how DATA & ASSETS is read. Each engine calls it for its own rows; whoever places the screen previewer gives the implementation
// (a product: over its API · the test app: over JSON files). `recording` wraps one and keeps what was read through it: the camera asks for that.
import type { LivePlayStep, LivePlayUiEvent, Route, Row, Surface, UiData, UiLivePlay, UiNode, UiPrototype, UiSnapshot } from "./model";

export interface DataReader {
  uiSnapshot(id: string): Promise<UiSnapshot>;
  uiPrototype(id: string): Promise<UiPrototype>;
  /** the routes of a surface */
  routes(surface: Surface): Promise<Route[]>;
  uiNode(id: string): Promise<UiNode>;
  /** a UI document, by its id */
  uiData(id: string): Promise<UiData>;
  /** the UI document a UI node is drawn with */
  uiDataOfNode(uiNodeId: string): Promise<UiData | null>;
  /** every version of a component document, by its name */
  uiDataByName(name: string): Promise<UiData[]>;
  /** rows of a world's table at a moment, in the order of the ids; null where the world has no such row then */
  rows(worldId: string, t: number, table: string, ids: string[]): Promise<(Row | null)[]>;
  /** the live plays of a UI prototype */
  livePlays(uiPrototypeId: string): Promise<UiLivePlay[]>;
  livePlay(id: string): Promise<UiLivePlay>;
  /** the steps of a live play, in no order: the play's stepOrder gives it */
  livePlaySteps(uiLivePlayId: string): Promise<LivePlayStep[]>;
  /** the UI events of a step, in no order: the step's uiEventOrder gives it */
  livePlayUiEvents(livePlayStepId: string): Promise<LivePlayUiEvent[]>;
}

/** one row that was read, with the version it had */
export type Read = { table: string; id: string; version: number };

export function recording(reader: DataReader): { reader: DataReader; read(): Read[] } {
  const seen = new Map<string, Read>();
  const note = (table: string, id: string, row: { version: number } | null) => { if (row) seen.set(table + " " + id, { table, id, version: row.version }); };
  return {
    read: () => [...seen.values()],
    reader: {
      uiSnapshot: async (id) => { const r = await reader.uiSnapshot(id); note("ui_snapshot", id, r); return r; },
      uiPrototype: async (id) => { const r = await reader.uiPrototype(id); note("ui_prototype", id, r); return r; },
      routes: async (surface) => { const rs = await reader.routes(surface); rs.forEach((r) => note("route", r.id, r)); return rs; },
      uiNode: async (id) => { const r = await reader.uiNode(id); note("ui_node", id, r); return r; },
      uiData: async (id) => { const r = await reader.uiData(id); note("ui_data", id, r); return r; },
      uiDataOfNode: async (uiNodeId) => { const r = await reader.uiDataOfNode(uiNodeId); if (r) note("ui_data", r.id, r); return r; },
      uiDataByName: async (name) => { const rs = await reader.uiDataByName(name); rs.forEach((r) => note("ui_data", r.id, r)); return rs; },
      rows: async (worldId, t, table, ids) => { const rs = await reader.rows(worldId, t, table, ids); rs.forEach((r, i) => note(table, ids[i], r)); return rs; },
      livePlays: async (uiPrototypeId) => { const rs = await reader.livePlays(uiPrototypeId); rs.forEach((r) => note("ui_live_play", r.id, r)); return rs; },
      livePlay: async (id) => { const r = await reader.livePlay(id); note("ui_live_play", id, r); return r; },
      livePlaySteps: async (uiLivePlayId) => { const rs = await reader.livePlaySteps(uiLivePlayId); rs.forEach((r) => note("live_play_step", r.id, r)); return rs; },
      livePlayUiEvents: async (livePlayStepId) => { const rs = await reader.livePlayUiEvents(livePlayStepId); rs.forEach((r) => note("live_play_ui_event", r.id, r)); return rs; },
    },
  };
}
