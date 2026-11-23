// The usage of one step: one shape for a model's token bill and a program's
// time, so a run total means the same across both. Units only; money is
// computed on read, never stored.

export type Measured = "reported" | "observed";

export interface Usage {
  worker: string;
  provider: string;
  model?: string;
  /** "reported" when the vendor billed the units, "observed" when we measured them */
  measured: Measured;
  /** invocations this record covers */
  calls: number;
  tokens?: { input: number; output: number };
  compute?: { wallMs: number; cpuMs?: number; maxRssBytes?: number };
}

/**
 * A step's usage: what the worker reported (zero or more times), summed, with
 * the runner's stopwatch as the wall time. A worker that reports nothing is
 * still visible; one observed report makes the whole step observed.
 */
export function foldReports(reports: Partial<Usage>[], observed: { worker: string; provider: string; wallMs: number }): Usage {
  const compute: NonNullable<Usage["compute"]> = { wallMs: observed.wallMs };
  const usage: Usage = { worker: observed.worker, provider: observed.provider, measured: "observed", calls: 1, compute };
  if (!reports.length) return usage;

  usage.measured = reports.every((r) => (r.measured ?? (r.tokens ? "reported" : "observed")) === "reported") ? "reported" : "observed";
  usage.calls = 0;
  for (const r of reports) {
    usage.calls += r.calls ?? 1;
    if (r.model) usage.model = r.model;
    if (r.tokens) {
      usage.tokens ??= { input: 0, output: 0 };
      usage.tokens.input += r.tokens.input;
      usage.tokens.output += r.tokens.output;
    }
    if (r.compute?.cpuMs !== undefined) compute.cpuMs = (compute.cpuMs ?? 0) + r.compute.cpuMs;
    if (r.compute?.maxRssBytes !== undefined) compute.maxRssBytes = Math.max(compute.maxRssBytes ?? 0, r.compute.maxRssBytes);
  }
  return usage;
}
