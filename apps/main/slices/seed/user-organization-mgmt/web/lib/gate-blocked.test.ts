// =============================================================================
// Gate-blocked handler tests — the request-time 428 → /resolve routing.
// Pure deps, node env.
// =============================================================================

import { describe, it, expect, vi } from "vitest";
import { createGateBlockedHandler } from "./gate-blocked";
import type { Obligation } from "../../shared/auth-config/resolver";

const OBLIGATIONS: Obligation[] = [
  { require: "legal_consent_granted" as const },
];

function deferred() {
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("createGateBlockedHandler", () => {
  it("navigates to /resolve carrying the blocked page as intention", () => {
    const navigate = vi.fn();
    const handler = createGateBlockedHandler({
      navigate,
      currentPath: () => "/manage-legal-documents?type=termsAndConditions",
    });
    handler(OBLIGATIONS);
    expect(navigate).toHaveBeenCalledWith({
      to: "/resolve",
      search: { intention: "/manage-legal-documents?type=termsAndConditions" },
    });
  });

  it("omits intention when currentPath is unwired", () => {
    const navigate = vi.fn();
    const handler = createGateBlockedHandler({ navigate });
    handler(OBLIGATIONS);
    expect(navigate).toHaveBeenCalledWith({ to: "/resolve" });
  });

  it("omits intention for protocol-relative paths", () => {
    const navigate = vi.fn();
    const handler = createGateBlockedHandler({
      navigate,
      currentPath: () => "//evil.example/phish",
    });
    handler(OBLIGATIONS);
    expect(navigate).toHaveBeenCalledWith({ to: "/resolve" });
  });

  it("skips only on /resolve — resolution lives there now", () => {
    const navigate = vi.fn();
    for (const path of ["/resolve", "/resolve?intention=%2Forganizations"]) {
      const handler = createGateBlockedHandler({
        navigate,
        currentPath: () => path,
      });
      handler(OBLIGATIONS);
    }
    expect(navigate).not.toHaveBeenCalled();
  });

  it("routes the once-exempt account surfaces like any other page", () => {
    for (const path of [
      "/my/settings/profile",
      "/my/settings/security?step=totp",
    ]) {
      const navigate = vi.fn();
      const handler = createGateBlockedHandler({
        navigate,
        currentPath: () => path,
      });
      handler(OBLIGATIONS);
      expect(navigate).toHaveBeenCalledTimes(1);
    }
  });

  it("does not skip pages that merely share a prefix", () => {
    const navigate = vi.fn();
    const handler = createGateBlockedHandler({
      navigate,
      currentPath: () => "/resolvednotes",
    });
    handler(OBLIGATIONS);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("collapses a burst of parallel 428s into one navigation", () => {
    const gate = deferred();
    const navigate = vi.fn(() => gate.promise);
    const handler = createGateBlockedHandler({
      navigate,
      currentPath: () => "/organizations",
    });
    handler(OBLIGATIONS);
    handler(OBLIGATIONS);
    handler(OBLIGATIONS);
    expect(navigate).toHaveBeenCalledTimes(1);
    gate.resolve();
  });

  it("releases the latch after navigation settles — resolve and reject", async () => {
    for (const settle of ["resolve", "reject"] as const) {
      const gate = deferred();
      const navigate = vi.fn(() => gate.promise);
      const handler = createGateBlockedHandler({
        navigate,
        currentPath: () => "/organizations",
      });
      handler(OBLIGATIONS);
      if (settle === "resolve") gate.resolve();
      else gate.reject(new Error("router exploded"));
      await Promise.resolve(); // let the finally run
      await Promise.resolve();
      handler(OBLIGATIONS);
      expect(navigate).toHaveBeenCalledTimes(2);
    }
  });

  it("seeds the gate query before navigating", () => {
    const calls: string[] = [];
    const handler = createGateBlockedHandler({
      navigate: () => {
        calls.push("navigate");
      },
      seedGate: () => {
        calls.push("seed");
      },
      currentPath: () => "/organizations",
    });
    handler(OBLIGATIONS);
    expect(calls).toEqual(["seed", "navigate"]);
  });

  it("never throws — a navigate that throws synchronously is contained", () => {
    const handler = createGateBlockedHandler({
      navigate: () => {
        throw new Error("router exploded");
      },
      currentPath: () => "/organizations",
    });
    expect(() => handler(OBLIGATIONS)).not.toThrow();
    // and the latch is released so a later 428 can still route
    expect(() => handler(OBLIGATIONS)).not.toThrow();
  });
});
