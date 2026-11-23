import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  EnvelopeError,
  fileRefType,
  runWorker,
  slot,
  type ByteArtifacts,
  type Logger,
  type Ref,
  type RunnableWorker,
  type StepContext,
  type StepRecorder,
  type WorkerCtx,
} from "..";

/** Bytes in a map: the smallest ByteArtifacts. */
function memoryArtifacts(): ByteArtifacts & { objects: Map<string, Uint8Array> } {
  const objects = new Map<string, Uint8Array>();
  return {
    objects,
    key: (...parts) => ["test", ...parts].join("/"),
    async putBytes(bytes, spec) {
      objects.set(spec.key, bytes);
      return { type: spec.type ?? (fileRefType(spec.format) as never), format: spec.format, ref: spec.key, bytes: bytes.byteLength, meta: spec.meta };
    },
    async getBytes(ref) {
      const b = objects.get(ref.ref);
      if (!b) throw new Error(`no object ${ref.ref}`);
      return b;
    },
  };
}

const silent: Logger = { info: () => {}, warn: () => {}, error: () => {} };

const contract = {
  meta: { capability: "image-to-text" as const, vendor: "test", runtimes: ["server"] as const },
  config: z.object({ upper: z.boolean().default(false) }),
  input: { text: slot("type-text", { limits: { "constraint-bytes": 50 } }) },
  output: { text: slot("type-text", { formats: ["format-plaintext"] }) },
};

function harness(run: RunnableWorker["run"], deps?: unknown, withDeps = false) {
  const artifacts = memoryArtifacts();
  const events: Parameters<StepRecorder["recordStep"]>[1][] = [];
  const steps: StepRecorder = { recordStep: async (_runId, e) => void events.push(e) };
  const worker: RunnableWorker = {
    id: "echo-text",
    version: "v1",
    contract: withDeps ? { ...contract, deps: z.object({ apiKey: z.string().min(1), region: z.string().default("eu") }) } : contract,
    run,
  };
  const ctx: StepContext = { runId: "r1", stepKey: "echo", artifacts, deps, log: silent };
  return { artifacts, events, steps, worker, ctx };
}

describe("runWorker", () => {
  it("validates, runs, validates the output and records running then ok with usage", async () => {
    const h = harness(async (input, _cfg, ctx) => {
      const inp = input as { text: { ref: string } };
      const bytes = h.artifacts.objects.get(inp.text.ref)!;
      ctx.report({ tokens: { input: 3, output: 4 }, model: "m" });
      return { text: await ctx.artifacts.putBytes(bytes, { type: "type-text", format: "format-plaintext", key: "out.txt" }) };
    });
    await h.artifacts.putBytes(new TextEncoder().encode("hello"), { type: "type-text", format: "format-plaintext", key: "in.txt" });

    const env = await runWorker(h.worker, { text: { type: "type-text", format: "format-plaintext", ref: "in.txt" } }, {}, h.ctx, h.steps);

    expect(env.status).toBe("ok");
    expect(h.events.map((e) => e.status)).toEqual(["running", "ok"]);
    expect(h.events[1]?.usage?.tokens).toEqual({ input: 3, output: 4 });
    expect(h.events[1]?.usage?.measured).toBe("reported");
  });

  it("rejects a bad config before touching the input", async () => {
    const h = harness(async () => ({}));
    const env = await runWorker(h.worker, {}, { upper: "yes" }, h.ctx, h.steps);
    expect(env.status === "error" && env.error.code).toBe("config_invalid");
    expect(h.events.map((e) => e.status)).toEqual(["error"]);
  });

  it("rejects an input over the slot's byte limit without running, from the size the ref carries", async () => {
    let ran = false;
    const h = harness(async () => {
      ran = true;
      return {};
    });
    const env = await runWorker(h.worker, { text: { type: "type-text", format: "format-plaintext", ref: "big.txt", bytes: 51 } }, {}, h.ctx, h.steps);
    expect(env.status === "error" && env.error.code).toBe("input_too_large");
    expect(ran).toBe(false);
  });

  it("does not look the file up: a ref it cannot read fails inside the worker", async () => {
    const h = harness(async (input, _cfg, ctx) => {
      await ctx.artifacts.getBytes((input as { text: Ref }).text);
      return {};
    });
    const env = await runWorker(h.worker, { text: { type: "type-text", format: "format-plaintext", ref: "missing" } }, {}, h.ctx, h.steps);
    expect(env.status === "error" && env.error.code).toBe("worker_failed");
  });

  it("a thrown EnvelopeError keeps its code; a plain throw is worker_failed", async () => {
    const h1 = harness(async () => {
      throw new EnvelopeError({ code: "input_invalid", message: "not a table", retryable: true });
    });
    await h1.artifacts.putBytes(new Uint8Array(1), { type: "type-text", format: "format-plaintext", key: "in.txt" });
    const e1 = await runWorker(h1.worker, { text: { type: "type-text", format: "format-plaintext", ref: "in.txt" } }, {}, h1.ctx, h1.steps);
    expect(e1.status === "error" && e1.error).toEqual({ code: "input_invalid", message: "not a table", retryable: true });

    const h2 = harness(async () => {
      throw new Error("boom");
    });
    await h2.artifacts.putBytes(new Uint8Array(1), { type: "type-text", format: "format-plaintext", key: "in.txt" });
    const e2 = await runWorker(h2.worker, { text: { type: "type-text", format: "format-plaintext", ref: "in.txt" } }, {}, h2.ctx, h2.steps);
    expect(e2.status === "error" && e2.error.code).toBe("worker_failed");
    expect(h2.events.at(-1)?.usage?.compute?.wallMs).toBeGreaterThanOrEqual(0);
  });

  it("an output that breaks the contract is output_invalid", async () => {
    const h = harness(async () => ({ text: { type: "type-text", format: "format-png", ref: "x" } }));
    await h.artifacts.putBytes(new Uint8Array(1), { type: "type-text", format: "format-plaintext", key: "in.txt" });
    const env = await runWorker(h.worker, { text: { type: "type-text", format: "format-plaintext", ref: "in.txt" } }, {}, h.ctx, h.steps);
    expect(env.status === "error" && env.error.code).toBe("output_invalid");
  });

  it("hands the worker its deps parsed, defaults filled, and nothing else of the runner", async () => {
    let seen: WorkerCtx | undefined;
    const h = harness(async (_input, _cfg, ctx) => {
      seen = ctx as WorkerCtx;
      return { text: { type: "type-text", format: "format-plaintext", ref: "x" } };
    }, { apiKey: "k" }, true);
    const env = await runWorker(h.worker, { text: { type: "type-text", format: "format-plaintext", ref: "in.txt" } }, {}, h.ctx, h.steps);
    expect(env.status).toBe("ok");
    expect(seen?.deps).toEqual({ apiKey: "k", region: "eu" });
    expect(Object.keys(seen ?? {}).sort()).toEqual(["artifacts", "deps", "report", "runId", "stepKey"]);
  });

  it("a missing dep is worker_failed before running, naming the dep and not its value", async () => {
    let ran = false;
    const h = harness(async () => {
      ran = true;
      return {};
    }, { apiKey: "" }, true);
    const env = await runWorker(h.worker, { text: { type: "type-text", format: "format-plaintext", ref: "in.txt" } }, {}, h.ctx, h.steps);
    expect(env.status === "error" && env.error.code).toBe("worker_failed");
    expect(env.status === "error" && env.error.message).toMatch(/is not configured here: deps\.apiKey/);
    expect(ran).toBe(false);
    expect(h.events.map((e) => e.status)).toEqual(["error"]);
  });

  it("a worker without deps gets undefined, whatever the runner passes", async () => {
    let seen: unknown = "unset";
    const h = harness(async (_input, _cfg, ctx) => {
      seen = (ctx as WorkerCtx).deps;
      return { text: { type: "type-text", format: "format-plaintext", ref: "x" } };
    }, { secret: "s" });
    await runWorker(h.worker, { text: { type: "type-text", format: "format-plaintext", ref: "in.txt" } }, {}, h.ctx, h.steps);
    expect(seen).toBeUndefined();
  });
});
