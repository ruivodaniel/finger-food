/**
 * The generic part of every slice's API client: cookie sessions, JSON, the
 * active-org header, and one error shape. The core builds it once and hands it
 * to each slice at mount; a slice's services/api only adds its own paths.
 */

const FALLBACK_MESSAGE = "Something went wrong — please try again.";

export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Any slice's http error: the core's ApiError, or one shaped like it. */
export function isApiError(error: unknown): error is Error & { status: number; body?: unknown } {
  return error instanceof Error && typeof (error as { status?: unknown }).status === "number";
}

export interface HttpClient {
  /** `path` is absolute from the API origin, e.g. "/api/client/me". */
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

export interface HttpClientOptions {
  /** API origin, e.g. http://localhost:3000 (no trailing slash). */
  baseUrl: string;
  /** The org the caller acts IN, stamped on every request when there is one. */
  activeOrgId: () => string | null;
  activeOrgHeader: string;
}

function messageOf(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>).error;
  return typeof value === "string" ? value : null;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  return {
    async request<T>(path: string, init?: RequestInit): Promise<T> {
      const activeOrgId = options.activeOrgId();
      const { headers, ...rest } = init ?? {};
      const response = await fetch(`${options.baseUrl}${path}`, {
        credentials: "include",
        ...rest,
        // A caller's headers are added to these, never in place of them.
        headers: {
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...(activeOrgId ? { [options.activeOrgHeader]: activeOrgId } : {}),
          ...Object.fromEntries(new Headers(headers)),
        },
      });
      const text = await response.text();
      const body = text ? safeJson(text) : undefined;
      if (!response.ok) {
        throw new ApiError(
          response.status,
          response.status >= 500 ? FALLBACK_MESSAGE : (messageOf(body) ?? FALLBACK_MESSAGE),
          body,
        );
      }
      return body as T;
    },
  };
}
