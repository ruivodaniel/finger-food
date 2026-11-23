// THE ROWS the engines read, in the shape of the canonical ERD (product-artifacts). Pure types. Every row carries the version it has: what a picture is checked against.
import type { Doc } from "../../../../ui/ui-data/v3/types";

export type Surface = "web" | "mobile";
/** a row of a world's table at a moment (a table of the product: organization, member, user_profile…) */
export type Row = Record<string, unknown> & { version: number };

/** a request as the server sees it */
export type ApiRequest = { method: string; path: string; query?: Record<string, string>; headers?: Record<string, string>; body?: unknown };
export type ApiResponse = { status: number; body: unknown };
/** one request a page makes, with the response recorded for it. In a body, `{ table, ids }` stands for those rows of the world and `{ table, id }` for one row */
export type RecordedRequest = { request: ApiRequest; response: ApiResponse };

/** what a UI snapshot and a UI prototype both have: a world at a moment, what the store and the URL start with, the recorded requests */
type WithData = { id: string; version: number; worldId: string; t: number; initialStoreState?: Record<string, unknown>; initialParams?: Record<string, string>; recordedRequests: RecordedRequest[] };
/** one page with its data */
export type UiSnapshot = WithData & { uiDataId: string; name?: string; title?: string };
/** many pages with their data */
export type UiPrototype = WithData & { initialUiDataId: string; title: string; useCaseId?: string };
/** the two prefixes of a live screen URL, and the row each one names */
export type Kind = "ui-snapshot" | "ui-prototype";

export type UiNode = { id: string; version: number; type?: string; surface?: Surface; title?: string };
/** a UI document: a page, or a component a page uses */
export type UiData = { id: string; version: number; uiNodeId: string; kind: "page" | "component"; name: string; document: Doc };
/** a path pattern (`/organizations/:organizationId/info`) and the UI node it shows. A route with routes under it is not a page: its UI node is the shell they are shown in */
export type Route = { id: string; version: number; surface: Surface; path: string; uiNodeId: string; parentId?: string };

/** a script over a UI prototype: ordered steps */
export type UiLivePlay = { id: string; version: number; title: string; uiPrototypeId: string; description?: string; stepOrder: string[] };
/** a separator (another person acts from here, or an explanation), or actions in the browser, in order */
export type LivePlayStep = { id: string; version: number; uiLivePlayId: string; kind: "actions" | "separator"; separatorKind?: "persona" | "note"; worldUserId?: string; text?: string; uiEventOrder?: string[] };
export type UiAct = "goto" | "enter" | "scroll" | "click" | "fill" | "select" | "check" | "uncheck" | "hover" | "wait" | "press" | "upload" | "leave" | "set_url_param" | "refetch";
/** what a user does in the browser. `target`: the test id of the element; for set_url_param, the name of the parameter. `waitMs`: how long to wait before the gesture; `durationMs`: how long it takes */
export type LivePlayUiEvent = { id: string; version: number; livePlayStepId: string; act: UiAct; target?: string; value?: string; url?: string; waitMs?: number; durationMs?: number };

export type { Doc };
