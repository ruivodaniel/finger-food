/**
 * Running a worker as a step: what the worker sees (its context), and
 * `runWorker`, which every runner uses the same way.
 *
 * `runWorker` parses the config and the deps, validates the input, runs,
 * validates the output and records the step with its usage. It always returns
 * an envelope; a thrown error becomes an error envelope.
 *
 * Two contexts, so a worker's type says where it can run:
 * - WorkerCtx: bytes in and out. Any runtime.
 * - NodeWorkerCtx: also a scratch directory and local files. Node only.
 */

import type { z } from "zod";
import type { ByteArtifacts, FileArtifacts } from "./artifacts";
import { resolveOutput, type AnyWorkerContract, type ConfigOf, type DepsOf, type OutputSlots } from "./contract";
import { toRunError, type Envelope } from "./envelope";
import type { SlotValues } from "./slot";
import { foldReports, type Usage } from "./usage";
import { validateInput, validateOutput } from "./validate";

// ── what the worker sees ────────────────────────────────────────────────────

export interface WorkerCtx<D = unknown> {
  runId: string;
  stepKey: string;
  artifacts: ByteArtifacts;
  /** what the contract's `deps` declares, parsed */
  deps: D;
  /** what only the worker knows: tokens, child compute */
  report(usage: Partial<Usage>): void;
}

export interface NodeWorkerCtx<D = unknown> extends WorkerCtx<D> {
  /** a scratch directory for this step; materialized inputs and outputs go here */
  workdir: string;
  artifacts: FileArtifacts;
}

export type WorkerRun<W extends AnyWorkerContract, C extends WorkerCtx<DepsOf<W>> = WorkerCtx<DepsOf<W>>> = (
  input: SlotValues<W["input"]>,
  config: ConfigOf<W>,
  ctx: C,
) => Promise<SlotValues<OutputSlots<W>>>;

/** A worker that needs local files: it runs where there is a file system. */
export type NodeWorkerRun<W extends AnyWorkerContract> = WorkerRun<W, NodeWorkerCtx<DepsOf<W>>>;

// ── running one as a step ───────────────────────────────────────────────────

/** The fields go through the runner's own filter (the orchestrator's drops anything not on its allowlist). */
export interface Logger {
  info(fields: Record<string, unknown>, message: string): void;
  warn(fields: Record<string, unknown>, message: string): void;
  error(fields: Record<string, unknown>, message: string): void;
}

export type StepStatus = "running" | "ok" | "error";

export interface StepRecorder {
  recordStep(runId: string, event: { stepKey: string; worker: string; version: string; status: StepStatus; envelope?: Envelope; usage?: Usage }): Promise<void>;
}

export interface RunnableWorker {
  id: string;
  version: string;
  contract: AnyWorkerContract;
  /** method syntax on purpose: a NodeWorkerRun (wanting more of the ctx) is still a RunnableWorker */
  run(input: never, config: never, ctx: WorkerCtx): Promise<unknown>;
}

/** What the runner hands `runWorker` for one step. */
export interface StepContext {
  runId: string;
  stepKey: string;
  /** FileArtifacts and a workdir where the runner has a file system */
  artifacts: ByteArtifacts | FileArtifacts;
  workdir?: string;
  /** this worker's deps, unparsed; checked against the contract's `deps` */
  deps?: unknown;
  log: Logger;
}

const firstIssue = (issues: z.core.$ZodIssue[]) => {
  const i = issues[0];
  const at = i?.path.map(String).join(".");
  return `${at ? `${at} ` : ""}${i?.message ?? "invalid"}`;
};

export async function runWorker(
  worker: RunnableWorker,
  input: unknown,
  config: unknown,
  ctx: StepContext,
  steps: StepRecorder,
): Promise<Envelope> {
  const record = (status: StepStatus, envelope?: Envelope, usage?: Usage) =>
    steps.recordStep(ctx.runId, { stepKey: ctx.stepKey, worker: worker.id, version: worker.version, status, envelope, usage });
  const fail = async (envelope: Envelope) => {
    await record("error", envelope);
    return envelope;
  };

  const cfg = worker.contract.config.safeParse(config ?? {});
  if (!cfg.success) {
    return fail({
      status: "error",
      error: { code: "config_invalid", message: `config: ${firstIssue(cfg.error.issues)}`, retryable: false, details: { issues: cfg.error.issues.slice(0, 10) } },
    });
  }

  // Deps are the runner's, not the caller's: a missing one is this runner
  // unable to run the worker. Only the path is named, never a value.
  let deps: unknown = undefined;
  if (worker.contract.deps) {
    const parsed = worker.contract.deps.safeParse(ctx.deps ?? {});
    if (!parsed.success) {
      return fail({ status: "error", error: { code: "worker_failed", message: `worker "${worker.id}" is not configured here: deps.${firstIssue(parsed.error.issues)}`, retryable: false } });
    }
    deps = parsed.data;
  }

  const checked = await validateInput(worker.contract.input, input ?? {});
  if (checked.error) return fail({ status: "error", error: checked.error });

  await record("running");
  const reports: Partial<Usage>[] = [];
  const started = Date.now();
  const observed = () => ({ worker: worker.id, provider: worker.contract.meta.vendor, wallMs: Date.now() - started });
  // A workdir only where the runner has a file system: a byte-only runner
  // gives a WorkerCtx, and a node worker run there fails on what it lacks.
  const workerCtx: WorkerCtx = {
    runId: ctx.runId,
    stepKey: ctx.stepKey,
    artifacts: ctx.artifacts,
    deps,
    report: (u) => reports.push(u),
    ...(ctx.workdir !== undefined ? { workdir: ctx.workdir } : {}),
  };

  let output: unknown;
  try {
    output = await worker.run(checked.values as never, cfg.data as never, workerCtx);
  } catch (err) {
    const env: Envelope = { status: "error", error: toRunError(err) };
    ctx.log.warn({ runId: ctx.runId, stepKey: ctx.stepKey, worker: worker.id, errorCode: env.error.code }, "worker failed");
    await record("error", env, foldReports(reports, observed()));
    return env;
  }

  const outputSlots = resolveOutput(worker.contract.output, cfg.data);
  const checkedOut = validateOutput(outputSlots, output);
  const env: Envelope = checkedOut.error ? { status: "error", error: checkedOut.error } : { status: "ok", output: checkedOut.values };
  await record(env.status, env, foldReports(reports, observed()));
  return env;
}
