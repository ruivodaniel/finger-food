// =============================================================================
// kratosError mapping tests — pure classification of provider responses.
// The provider's message-id catalog grows across versions; these pin the
// shape-based rules so unknown 400s degrade to readable policy violations,
// never 500s on user input.
// =============================================================================

import { describe, it, expect } from "vitest";
import { kratosError } from "./kratos-client";

const flowWith = (messages: Array<{ id: number; text: string }>) => ({
  ui: { nodes: [{ messages }] },
});

describe("kratosError classification", () => {
  it("duplicate identifier (4000007)", () => {
    const error = kratosError(
      400,
      flowWith([{ id: 4000007, text: "An account with the same identifier exists" }]),
    );
    expect(error.kind).toBe("duplicate_identifier");
  });

  it("invalid credentials (4000006)", () => {
    const error = kratosError(
      400,
      flowWith([{ id: 4000006, text: "The provided credentials are invalid" }]),
    );
    expect(error.kind).toBe("invalid_credentials");
  });

  it("UNKNOWN 400 message ids degrade to policy_violation with the provider's text", () => {
    // the breached-password rejection that once mapped to a 500
    const error = kratosError(
      400,
      flowWith([
        {
          id: 4000034,
          text: "The password has been found in data breaches and must no longer be used.",
        },
      ]),
    );
    expect(error.kind).toBe("policy_violation");
    expect(error.message).toMatch(/data breaches/);
  });

  it("400 with NO messages stays provider_error", () => {
    expect(kratosError(400, { error: { message: "malformed" } }).kind).toBe(
      "provider_error",
    );
  });

  it("401/403 → session_invalid; 410 → flow_expired; 5xx → provider_error", () => {
    expect(kratosError(401, {}).kind).toBe("session_invalid");
    expect(kratosError(410, {}).kind).toBe("flow_expired");
    expect(kratosError(500, {}).kind).toBe("provider_error");
  });

  it("403 session_refresh_required → reauthentication_required (privileged window elapsed)", () => {
    const payload = {
      error: {
        id: "session_refresh_required",
        message: "The requested action was forbidden",
        reason:
          "The login session is too old and thus not allowed to update these fields. Please re-authenticate.",
      },
    };
    expect(kratosError(403, payload).kind).toBe("reauthentication_required");
  });
});
