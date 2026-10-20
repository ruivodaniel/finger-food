import { describe, expect, it } from "vitest";
import { sanitizeError } from "./index";

describe("sanitizeError", () => {
  it("keeps an already-safe error shape", () => {
    expect(
      sanitizeError({
        code: "dispatch_visibility_timeout",
        safeMessage: "Dispatch timed out",
      })
    ).toEqual({
      code: "dispatch_visibility_timeout",
      safeMessage: "Dispatch timed out",
    });
  });

  it("does not leak raw error text from thrown errors", () => {
    expect(
      sanitizeError(new Error("Patient Jane Doe missed the 8am medication reminder"))
    ).toEqual({
      code: "internal_workflow_error",
      safeMessage: "Workflow execution failed",
    });
  });

  it("allows explicit safe fallbacks for raw failures", () => {
    expect(
      sanitizeError(new Error("provider returned 422 for +15555555555"), {
        code: "provider_dispatch_failed",
        safeMessage: "Provider dispatch failed",
      })
    ).toEqual({
      code: "provider_dispatch_failed",
      safeMessage: "Provider dispatch failed",
    });
  });
});
