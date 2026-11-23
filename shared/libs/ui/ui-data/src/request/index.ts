// THE REQUEST a document writes. A read (`data.<name>.source`) and an effect (`dispatch.action`) can be the request itself, as the product's API takes it:
//   "GET /organizations/:organizationId/members"
// The values beside it (a read's `params`, an action's `args`) fill the names of the path; the ones the path does not name go in the query of a GET
// and in the body of any other method. Pure: the validator checks the line, whoever sends the request builds it with `toRequest`.
import { REQUEST } from "../dictionary";

/** a request line, read: its method, its path, the names its path takes */
export type RequestLine = { method: (typeof REQUEST.methods)[number]; path: string; names: string[] };
/** the request a line and its values make */
export type DocRequest = { method: string; path: string; query?: Record<string, string>; body?: Record<string, unknown> };

/** true when a source or an action is written as a request (a method, a space, a path) and not as a name of the project's catalog */
export const isRequestLine = (line: unknown): line is string => typeof line === "string" && REQUEST.shape.test(line);

/** a request line into its parts, or null when it is not one the dictionary allows */
export function parseRequestLine(line: string): RequestLine | null {
  const m = REQUEST.pattern.exec(line);
  if (!m) return null;
  return { method: m[1] as RequestLine["method"], path: m[2], names: [...m[2].matchAll(REQUEST.name)].map((x) => x[1]) };
}

const empty = (v: unknown) => v === undefined || v === null || v === "";

/** the request: the values fill the path's names; the rest are the query of a GET, the body of any other method. A name with no value is an error. */
export function toRequest(line: string, values: Record<string, unknown> = {}): DocRequest {
  const parsed = parseRequestLine(line);
  if (!parsed) throw new Error(`not a request: ${line}`);
  const path = parsed.path.replace(REQUEST.name, (_m, name: string) => {
    if (empty(values[name])) throw new Error(`${line} needs ${name}`);
    return encodeURIComponent(String(values[name]));
  });
  const rest = Object.entries(values).filter(([k]) => !parsed.names.includes(k));
  if (parsed.method === "GET") {
    const query = Object.fromEntries(rest.filter(([, v]) => !empty(v)).map(([k, v]) => [k, String(v)]));
    return { method: parsed.method, path, ...(Object.keys(query).length ? { query } : {}) };
  }
  return { method: parsed.method, path, ...(rest.length ? { body: Object.fromEntries(rest) } : {}) };
}
