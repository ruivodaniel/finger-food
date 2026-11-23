import { describe, expect, it } from "vitest";
import { runSafely } from "@/workflow-intents/run-safely";

describe("runSafely", () => {
  it("returns the result when the work succeeds", async () => {
    expect(await runSafely(async () => ({ ok: true, value: 42 }))).toEqual({
      ok: true,
      value: 42,
    });
  });

  it("passes an already-safe error pair through unchanged", async () => {
    const safe = { code: "already_safe", safeMessage: "already sanitized" };

    await expect(
      runSafely(async () => {
        throw safe;
      }),
    ).rejects.toEqual(safe);
  });

  it("replaces a raw Error so its text can't reach a log or a column", async () => {
    const raw = () => {
      throw new Error("smtp said: mailbox ada@acme.test is over quota");
    };

    await expect(runSafely(raw)).rejects.toMatchObject({
      code: expect.any(String),
      safeMessage: expect.any(String),
    });
    await expect(runSafely(raw)).rejects.not.toMatchObject({
      message: expect.stringContaining("ada@acme.test"),
    });
  });

  it("uses the caller's fallback pair for anything not already safe", async () => {
    await expect(
      runSafely(
        async () => {
          throw new Error("something bad");
        },
        { code: "processor_failure", safeMessage: "processor failed" },
      ),
    ).rejects.toEqual({
      code: "processor_failure",
      safeMessage: "processor failed",
    });
  });

  it("sanitizes non-Error throwables too", async () => {
    await expect(
      runSafely(async () => {
        throw "raw string with ada@acme.test inside";
      }),
    ).rejects.not.toEqual("raw string with ada@acme.test inside");
  });
});
