/**
 * The http client the app hands over at mount, the module's two surfaces
 * (/api/auth and /api/client), and what the module adds to every failure: a
 * message a person can read, and the gate's 428 turned into a hand-off.
 * Every api file builds on it; nothing else may.
 */

import type { Obligation } from "../../../shared/auth-config/resolver";
import { summarizeObligations } from "../../shared/helpers/obligations";
import { isApiError } from "../../shared/helpers/api-error";

/** What the module needs from the app's http client. */
export interface UserOrgMgmtHttp {
  /** `path` is absolute from the API origin; rejects with an error carrying `status` and `body`. */
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

export interface HttpPaths {
  /** Auth surface base path — matches where the app mounts authMount (default /api/auth). */
  authPath?: string;
  /** Domain surface base path — matches where the app mounts the router (default /api/client). */
  clientPath?: string;
}

const FALLBACK_MESSAGE = "Something went wrong — please try again.";

let client: UserOrgMgmtHttp | null = null;
let authPath = "/api/auth";
let clientPath = "/api/client";
let onGateBlocked: ((obligations: Obligation[]) => void) | undefined;

export function configureHttp(
  http: UserOrgMgmtHttp,
  paths: HttpPaths,
  gateBlocked?: (obligations: Obligation[]) => void,
): void {
  client = http;
  authPath = paths.authPath ?? authPath;
  clientPath = paths.clientPath ?? clientPath;
  onGateBlocked = gateBlocked;
}

export const authUrl = (rest: string): string => `${authPath}${rest}`;
export const clientUrl = (rest: string): string => `${clientPath}${rest}`;

/** One org's endpoint — the target org is a path segment, never "current". */
export const orgUrl = (orgId: string, rest = ""): string =>
  clientUrl(`/organizations/${encodeURIComponent(orgId)}${rest}`);

/** Query string for list endpoints — undefined values dropped. */
export function listQueryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

/**
 * A human-readable message from an error body. The api answers
 * `{ error: "…" }`; a zod validation failure answers `{ error: ZodError }` —
 * an OBJECT, which must never reach a screen as "[object Object]".
 */
function errorMessageOf(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  for (const key of ["message", "error"] as const) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const issues = (value as { issues?: Array<{ message?: string; path?: Array<string | number> }> }).issues;
      if (Array.isArray(issues) && issues.length > 0) {
        return issues.map((i) => [i.path?.join("."), i.message].filter(Boolean).join(": ")).join("; ");
      }
    }
  }
  return null;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!client) throw new Error("user-organization-mgmt web is not mounted: call mountUserOrgMgmtWeb first");
  try {
    return await client.request<T>(path, init);
  } catch (error) {
    if (!isApiError(error)) throw error;
    const obligations = (error.body as { obligations?: Obligation[] } | undefined)?.obligations;
    // A 428 is the gate's structured "you still owe X" — summarize the
    // obligations into a message a person can act on (the caller can also
    // read them off the error's body to route to a resolve screen).
    if (error.status === 428 && obligations) {
      onGateBlocked?.(obligations);
      error.message = summarizeObligations(obligations);
    } else {
      error.message = error.status >= 500 ? FALLBACK_MESSAGE : (errorMessageOf(error.body) ?? FALLBACK_MESSAGE);
    }
    throw error;
  }
}

export const post = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });

/** The gate's own probe: a 428 is its answer, not a failure, and it carries no org context. */
export async function probe<T>(path: string): Promise<T> {
  if (!client) throw new Error("user-organization-mgmt web is not mounted: call mountUserOrgMgmtWeb first");
  try {
    return await client.request<T>(path, { headers: {} });
  } catch (error) {
    if (isApiError(error) && error.status === 428) return error.body as T;
    throw error;
  }
}
