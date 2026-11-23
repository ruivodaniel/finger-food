import { describe, expect, it } from "vitest";
import { foldReports } from "..";

describe("usage folding", () => {
  it("the runner's stopwatch is the floor when a worker reports nothing", () => {
    const u = foldReports([], { worker: "w", provider: "p", wallMs: 120 });
    expect(u).toEqual({ worker: "w", provider: "p", measured: "observed", calls: 1, compute: { wallMs: 120 } });
  });

  it("reported tokens keep provenance and the observed wall clock wins", () => {
    const u = foldReports([{ tokens: { input: 10, output: 5 }, model: "m", compute: { wallMs: 5 } }], { worker: "w", provider: "p", wallMs: 120 });
    expect(u.measured).toBe("reported");
    expect(u.tokens).toEqual({ input: 10, output: 5 });
    expect(u.compute?.wallMs).toBe(120);
  });

  it("sums reports and degrades to observed if any report is observed", () => {
    const u = foldReports(
      [
        { measured: "reported", tokens: { input: 1, output: 1 } },
        { measured: "observed", compute: { wallMs: 3, cpuMs: 2, maxRssBytes: 9 } },
      ],
      { worker: "w", provider: "p", wallMs: 10 },
    );
    expect(u.measured).toBe("observed");
    expect(u.calls).toBe(2);
    expect(u.compute).toEqual({ wallMs: 10, cpuMs: 2, maxRssBytes: 9 });
  });
});
