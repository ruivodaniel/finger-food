import { describe, expect, it } from "vitest";
import {
  DEFAULT_BACKOFF_BASE_MS,
  DEFAULT_BACKOFF_CAP_MS,
  DEFAULT_MAX_ATTEMPTS,
  calculateBackoffMs,
  nextAvailableAt,
  shouldFailInsteadOfReclaim,
} from "./index";

// Deterministic random sources for tests
const NO_JITTER = () => 0.5; // multiplier = 0.9 + 0.5 * 0.2 = 1.0 (identity)
const MIN_JITTER = () => 0; // multiplier = 0.9
const MAX_JITTER = () => 0.999_999; // multiplier ≈ 1.1

describe("calculateBackoffMs", () => {
  it("uses the base delay for the first retry (attemptCount=1) with no jitter", () => {
    expect(calculateBackoffMs(1, { random: NO_JITTER })).toBe(DEFAULT_BACKOFF_BASE_MS);
  });

  it("doubles the delay each attempt with no jitter", () => {
    expect(calculateBackoffMs(2, { random: NO_JITTER })).toBe(DEFAULT_BACKOFF_BASE_MS * 2);
    expect(calculateBackoffMs(3, { random: NO_JITTER })).toBe(DEFAULT_BACKOFF_BASE_MS * 4);
    expect(calculateBackoffMs(4, { random: NO_JITTER })).toBe(DEFAULT_BACKOFF_BASE_MS * 8);
  });

  it("caps the delay at the configured cap", () => {
    expect(calculateBackoffMs(20, { random: NO_JITTER })).toBe(DEFAULT_BACKOFF_CAP_MS);
  });

  it("treats attemptCount < 1 as the base delay (safety)", () => {
    expect(calculateBackoffMs(0, { random: NO_JITTER })).toBe(DEFAULT_BACKOFF_BASE_MS);
    expect(calculateBackoffMs(-3, { random: NO_JITTER })).toBe(DEFAULT_BACKOFF_BASE_MS);
  });

  it("honors custom base and cap", () => {
    expect(calculateBackoffMs(3, { baseMs: 1000, capMs: 10_000, random: NO_JITTER })).toBe(4000);
    expect(calculateBackoffMs(5, { baseMs: 1000, capMs: 10_000, random: NO_JITTER })).toBe(10_000);
  });

  it("applies ±10% jitter (spec § Retry budget)", () => {
    // attemptCount=1 → base=30_000ms, multiplier ∈ [0.9, 1.1]
    const minDelay = calculateBackoffMs(1, { random: MIN_JITTER });
    const maxDelay = calculateBackoffMs(1, { random: MAX_JITTER });

    expect(minDelay).toBeCloseTo(DEFAULT_BACKOFF_BASE_MS * 0.9, -1);
    expect(maxDelay).toBeCloseTo(DEFAULT_BACKOFF_BASE_MS * 1.1, -1);
    // Jitter actually varies the result:
    expect(minDelay).toBeLessThan(maxDelay);
  });

  it("jitter never exceeds the configured cap", () => {
    // With a deep attempt count, pre-jitter delay = cap. Post-jitter may exceed, but we clamp.
    const result = calculateBackoffMs(20, { random: MAX_JITTER });
    expect(result).toBeLessThanOrEqual(DEFAULT_BACKOFF_CAP_MS);
  });

  it("uses Math.random by default and produces values in the jitter band", () => {
    // Sample many runs; every value must live in [0.9*base, 1.1*base]
    const base = DEFAULT_BACKOFF_BASE_MS;
    for (let i = 0; i < 50; i++) {
      const ms = calculateBackoffMs(1);
      expect(ms).toBeGreaterThanOrEqual(Math.floor(base * 0.9));
      expect(ms).toBeLessThanOrEqual(Math.ceil(base * 1.1));
    }
  });
});

describe("nextAvailableAt", () => {
  it("adds the backoff to the given 'now' (deterministic no-jitter)", () => {
    const now = new Date("2026-04-22T12:00:00.000Z");
    const next = nextAvailableAt(now, 2, { random: NO_JITTER });
    expect(next).toBeInstanceOf(Date);
    expect(next.toISOString()).toBe("2026-04-22T12:01:00.000Z");
  });

  it("does not mutate the provided 'now'", () => {
    const now = new Date("2026-04-22T12:00:00.000Z");
    const snapshot = now.toISOString();
    nextAvailableAt(now, 5, { random: NO_JITTER });
    expect(now.toISOString()).toBe(snapshot);
  });
});

describe("shouldFailInsteadOfReclaim", () => {
  it("returns false when below the ceiling", () => {
    expect(shouldFailInsteadOfReclaim(1, DEFAULT_MAX_ATTEMPTS)).toBe(false);
    expect(shouldFailInsteadOfReclaim(DEFAULT_MAX_ATTEMPTS - 1, DEFAULT_MAX_ATTEMPTS)).toBe(false);
  });

  it("returns true when the attempt count has reached the ceiling", () => {
    expect(shouldFailInsteadOfReclaim(DEFAULT_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS)).toBe(true);
    expect(shouldFailInsteadOfReclaim(DEFAULT_MAX_ATTEMPTS + 4, DEFAULT_MAX_ATTEMPTS)).toBe(true);
  });
});

describe("foundation default constants", () => {
  it("matches the spec", () => {
    expect(DEFAULT_MAX_ATTEMPTS).toBe(10);
    expect(DEFAULT_BACKOFF_BASE_MS).toBe(30_000);
    expect(DEFAULT_BACKOFF_CAP_MS).toBe(60 * 60 * 1000);
  });
});
