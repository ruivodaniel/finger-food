// Minimal HTTP clients for the Kratos public and admin APIs. JSON in/out,
// typed errors — the adapter interprets shapes, this file only transports.

import { IdentityProviderError } from "../identity-provider.port";

export interface KratosUrls {
  publicUrl: string; // e.g. http://localhost:4433
  adminUrl: string; // e.g. http://localhost:4434 — never reachable publicly
}

export interface KratosRequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export class KratosHttp {
  constructor(private readonly baseUrl: string) {}

  async request<T>(path: string, init: KratosRequestInit = {}): Promise<T> {
    const { status, json } = await this.raw(path, init);
    if (status >= 200 && status < 300) return json as T;
    throw kratosError(status, json);
  }

  /** Like request(), but returns non-2xx payloads instead of throwing — some
   * self-service submissions report progress via 400-level responses. */
  async raw(
    path: string,
    init: KratosRequestInit = {},
  ): Promise<{ status: number; json: unknown }> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: init.method ?? "GET",
        headers: {
          Accept: "application/json",
          ...(init.body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
          ...init.headers,
        },
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      });
    } catch (cause) {
      throw new IdentityProviderError(
        "provider_error",
        `identity provider unreachable at ${this.baseUrl}`,
        cause,
      );
    }
    const text = await response.text();
    let json: unknown = undefined;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }
    }
    return { status: response.status, json };
  }
}

/** Map a Kratos error payload to the port's typed error. */
export function kratosError(
  status: number,
  payload: unknown,
): IdentityProviderError {
  const messages = collectUiMessages(payload);
  const text =
    messages.join("; ") ||
    (payload as { error?: { message?: string; reason?: string } })?.error
      ?.message ||
    `identity provider responded ${status}`;

  if (status === 401 || status === 403) {
    // Privileged self-service changes (credentials) demand a RECENT
    // authentication (privileged_session_max_age) — the session itself is
    // fine, it's just too old for this change. Callers offer a re-login.
    const errorId = (payload as { error?: { id?: string } })?.error?.id;
    if (errorId === "session_refresh_required") {
      return new IdentityProviderError("reauthentication_required", text, payload);
    }
    return new IdentityProviderError("session_invalid", text, payload);
  }
  if (status === 410) {
    return new IdentityProviderError("flow_expired", text, payload);
  }
  if (status === 400) {
    const ids = collectUiMessageIds(payload);
    // 4000007: an account with the same identifier exists
    if (ids.includes(4000007)) {
      return new IdentityProviderError("duplicate_identifier", text, payload);
    }
    // 4000006: invalid credentials; 4010008: invalid/expired login code;
    // 4070006: invalid verification code; 4060006: invalid recovery code;
    // 4040003: invalid/used registration code
    if (
      ids.some((id) =>
        [4000006, 4010008, 4070006, 4060006, 4040003].includes(id),
      )
    ) {
      return new IdentityProviderError("invalid_credentials", text, payload);
    }
    // Any other 400 carrying UI messages is input the provider refused
    // (password too weak / breached / too similar, schema validation, …).
    // The message-id catalog grows across provider versions — classify by
    // shape, surface the provider's own text, never 500 on user input.
    if (ids.length > 0) {
      return new IdentityProviderError("policy_violation", text, payload);
    }
    return new IdentityProviderError("provider_error", text, payload);
  }
  return new IdentityProviderError("provider_error", text, payload);
}

interface UiMessage {
  id: number;
  text: string;
}

interface UiShape {
  ui?: {
    messages?: UiMessage[];
    nodes?: Array<{ messages?: UiMessage[] }>;
  };
}

function uiMessagesOf(payload: unknown): UiMessage[] {
  const ui = (payload as UiShape)?.ui;
  if (!ui) return [];
  const nodeMessages = (ui.nodes ?? []).flatMap((n) => n.messages ?? []);
  return [...(ui.messages ?? []), ...nodeMessages];
}

export function collectUiMessages(payload: unknown): string[] {
  return uiMessagesOf(payload).map((m) => m.text);
}

export function collectUiMessageIds(payload: unknown): number[] {
  return uiMessagesOf(payload).map((m) => m.id);
}
