// THE MOCK API: in place of the product's API. A request in, a response out. It computes nothing: it finds the recorded request and puts the world's rows in its response.
import type { ApiRequest, RecordedRequest, Row, UiPrototype, UiSnapshot } from "../model";
import type { DataReader } from "../reader";

/** the headers the live screen adds to what the page sends: the row the request is for, and the moment when the URL has `_t` */
export const HEADER = { uiPrototype: "uiPrototype", uiSnapshot: "uiSnapshot", moment: "t" } as const;

export class MockApiError extends Error { constructor(public status: number, message: string) { super(message); this.name = "MockApiError"; } }
export type Answer = { status: number; body: unknown; /** set when the closest recorded request answered: what it did not match */ warning?: string };
export type Found = { recorded: RecordedRequest; same: boolean; /** what the recorded request does not answer: `page=34`, `header activeOrganization=o-x` */ unmatched: string[] };
type Rows = Map<string, Map<string, Row | null>>;

export interface MockApi {
  /** runs the four below, in order */
  handle(request: ApiRequest): Promise<Answer>;
  /** the UI snapshot or UI prototype the request names, and the moment: the header t, else the row's own */
  whoAsks(headers: Record<string, string> | undefined): Promise<{ row: UiSnapshot | UiPrototype; moment: number }>;
  findRecorded(recordedRequests: RecordedRequest[], request: ApiRequest): Found | null;
  /** those rows of the world at the moment */
  readRows(table: string, ids: string[], moment: number, worldId: string): Promise<(Row | null)[]>;
  fillResponse(body: unknown, rows: Rows): unknown;
}

const show = (r: ApiRequest) => `${r.method.toUpperCase()} ${r.path}${r.query && Object.keys(r.query).length ? "?" + new URLSearchParams(r.query).toString() : ""}`;
const differ = (a: Record<string, string> | undefined, b: Record<string, string> | undefined, keys: string[]) => keys.filter((k) => String(a?.[k] ?? "") !== String(b?.[k] ?? ""));

/** the same request (method, path, query, and every header the recording names); else the closest with the same method and path; else nothing. Pure. */
export function findRecorded(recordedRequests: RecordedRequest[], request: ApiRequest): Found | null {
  let best: (Found & { score: number }) | null = null;
  for (const recorded of recordedRequests) {
    if (recorded.request.method.toUpperCase() !== request.method.toUpperCase() || recorded.request.path !== request.path) continue;
    const queryKeys = [...new Set([...Object.keys(recorded.request.query ?? {}), ...Object.keys(request.query ?? {})])];
    const headerKeys = Object.keys(recorded.request.headers ?? {});
    const q = differ(recorded.request.query, request.query, queryKeys), h = differ(recorded.request.headers, request.headers, headerKeys);
    if (!q.length && !h.length) return { recorded, same: true, unmatched: [] };
    const score = queryKeys.length - q.length + headerKeys.length - h.length;
    if (!best || score > best.score) best = { recorded, same: false, score, unmatched: [...q.map((k) => `${k}=${request.query?.[k] ?? ""}`), ...h.map((k) => `header ${k}=${request.headers?.[k] ?? ""}`)] };
  }
  return best ? { recorded: best.recorded, same: false, unmatched: best.unmatched } : null;
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isManyRows = (v: unknown): v is { table: string; ids: string[] } => isObject(v) && Object.keys(v).length === 2 && typeof v.table === "string" && Array.isArray(v.ids);
const isOneRow = (v: unknown): v is { table: string; id: string } => isObject(v) && Object.keys(v).length === 2 && typeof v.table === "string" && typeof v.id === "string";

/** every row a body names, by table. Pure. */
export function rowsNamed(body: unknown, into = new Map<string, Set<string>>()): Map<string, Set<string>> {
  const add = (table: string, ids: string[]) => { const s = into.get(table) ?? new Set<string>(); ids.forEach((i) => s.add(i)); into.set(table, s); };
  if (isManyRows(body)) add(body.table, body.ids);
  else if (isOneRow(body)) add(body.table, [body.id]);
  else if (Array.isArray(body)) body.forEach((x) => rowsNamed(x, into));
  else if (isObject(body)) Object.values(body).forEach((x) => rowsNamed(x, into));
  return into;
}
/** the body, with the rows in place of every `{ table, ids }` (the rows the world has, in that order) and `{ table, id }` (the row, or null). Pure. */
export function fillResponse(body: unknown, rows: Rows): unknown {
  if (isManyRows(body)) return body.ids.map((i) => rows.get(body.table)?.get(i)).filter((r) => !!r);
  if (isOneRow(body)) return rows.get(body.table)?.get(body.id) ?? null;
  if (Array.isArray(body)) return body.map((x) => fillResponse(x, rows));
  if (isObject(body)) return Object.fromEntries(Object.entries(body).map(([k, x]) => [k, fillResponse(x, rows)]));
  return body;
}

export function createMockApi(reader: DataReader): MockApi {
  const self: MockApi = {
    async handle(request) {
      const { row, moment } = await self.whoAsks(request.headers);
      const { [HEADER.uiPrototype]: _p, [HEADER.uiSnapshot]: _s, [HEADER.moment]: _t, ...headers } = request.headers ?? {};
      const found = self.findRecorded(row.recordedRequests, { ...request, headers });
      if (!found) throw new MockApiError(501, `no recorded request for ${request.method.toUpperCase()} ${request.path}`);
      const rows: Rows = new Map();
      await Promise.all([...rowsNamed(found.recorded.response.body)].map(async ([table, ids]) => {
        const list = [...ids], read = await self.readRows(table, list, moment, row.worldId);
        rows.set(table, new Map(list.map((id, i) => [id, read[i]])));
      }));
      const body = self.fillResponse(found.recorded.response.body, rows), status = found.recorded.response.status;
      if (status >= 400) throw new MockApiError(status, isObject(body) && typeof body.message === "string" ? body.message : String(status));
      return { status, body, ...(found.same ? {} : { warning: `${show(request)}: answered with the closest recorded request; not matched: ${found.unmatched.join(", ")}` }) };
    },
    async whoAsks(headers) {
      const prototype = headers?.[HEADER.uiPrototype], snapshot = headers?.[HEADER.uiSnapshot];
      if (!prototype && !snapshot) throw new MockApiError(400, "the request names no UI prototype and no UI snapshot");
      const row = prototype ? await reader.uiPrototype(prototype) : await reader.uiSnapshot(snapshot!);
      const t = headers?.[HEADER.moment];
      return { row, moment: t !== undefined && t !== "" ? Number(t) : row.t };
    },
    findRecorded,
    readRows: (table, ids, moment, worldId) => reader.rows(worldId, moment, table, ids),
    fillResponse,
  };
  return self;
}
