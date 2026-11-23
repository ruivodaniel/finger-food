import { env, pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";
import { EnvelopeError, type WorkerRun } from "@libs/orchestrator-lib-schema";
import { MAX_SECONDS, type Segment } from "./contract";
import type * as contract from "./contract";
import { MODEL } from "./model";
import { decodeWav, SAMPLE_RATE, WavError } from "./wav";

/** Whisper reads 30-second windows; longer audio is cut into them, overlapping by 5 seconds. */
const CHUNK_SECONDS = 30;
const STRIDE_SECONDS = 5;

const MODEL_ID = `${MODEL.repo}@${MODEL.revision.slice(0, 7)}`;

// One loaded model per base URL, kept for the life of the process (or the
// page): loading reads ~40 MB and builds two ONNX sessions.
const loaded = new Map<string, Promise<AutomaticSpeechRecognitionPipeline>>();

/**
 * The model, from our host only. transformers.js reads where to fetch from its
 * global `env`, so this sets it: our base as the remote host, no local model
 * folder, and, in the browser, ONNX Runtime's WebAssembly from our base too
 * (its default is a public CDN). The browser keeps the files in its Cache
 * Storage, node in the library's cache folder. One base URL per process is
 * the expected case.
 *
 * The pinned revision is written into the path template, not only passed as
 * `revision`: transformers.js 4.3.2 reads config.json once without the
 * revision (asking for `main`), and the template sends that read to the
 * pinned folder too.
 */
export function loadModel(modelBaseUrl: string): Promise<AutomaticSpeechRecognitionPipeline> {
  let model = loaded.get(modelBaseUrl);
  if (!model) {
    const base = modelBaseUrl.endsWith("/") ? modelBaseUrl : `${modelBaseUrl}/`;
    env.remoteHost = base;
    env.remotePathTemplate = `{model}/resolve/${MODEL.revision}/`;
    env.allowRemoteModels = true;
    env.allowLocalModels = false;
    selfHostRuntime(base);
    model = pipeline("automatic-speech-recognition", MODEL.repo, { revision: MODEL.revision, dtype: MODEL.dtype }) as Promise<AutomaticSpeechRecognitionPipeline>;
    // a failed load is not kept: the next step tries again
    model.catch(() => loaded.delete(modelBaseUrl));
    loaded.set(modelBaseUrl, model);
  }
  return model;
}

/**
 * ONNX Runtime's WebAssembly, from `<base>onnxruntime-web/<version>/`. On load,
 * transformers.js points it at a CDN, choosing the build for the browser
 * (asyncify, or the plain one where asyncify does not run); this keeps its
 * choice of file and moves the host. Node runs ONNX Runtime natively and never
 * reads these paths.
 */
export function selfHostRuntime(base: string): void {
  const onnx = env.backends.onnx;
  if (!onnx.wasm) return;
  const prefix = `${base}onnxruntime-web/${onnx.versions?.web ?? "unknown"}/`;
  const file = (url: unknown) => String(url).split("/").pop();
  const paths = onnx.wasm.wasmPaths;
  onnx.wasm.wasmPaths = paths && typeof paths === "object" && "mjs" in paths && "wasm" in paths ? { mjs: prefix + file(paths.mjs), wasm: prefix + file(paths.wasm) } : prefix;
}

interface Chunk {
  timestamp: [number, number | null];
  text: string;
}

export const run: WorkerRun<typeof contract> = async (input, cfg, ctx) => {
  const bytes = await ctx.artifacts.getBytes(input.audio);
  let audio;
  try {
    audio = decodeWav(bytes);
  } catch (err) {
    if (err instanceof WavError) throw new EnvelopeError({ code: "input_invalid", message: `the audio could not be read: ${err.message}`, retryable: false, details: { slot: "audio" } });
    throw err;
  }
  if (audio.seconds > MAX_SECONDS) {
    throw new EnvelopeError({
      code: "input_invalid",
      message: `the audio is ${Math.round(audio.seconds)} s long; this worker takes up to ${MAX_SECONDS} s`,
      retryable: false,
      details: { slot: "audio", "constraint-duration": MAX_SECONDS, seconds: audio.seconds },
    });
  }

  const asr = await loadModel(ctx.deps.modelBaseUrl);
  const started = performance.now();
  const result = await asr(audio.samples, {
    language: cfg.language,
    task: cfg.task,
    return_timestamps: cfg.timestamps,
    chunk_length_s: audio.seconds > CHUNK_SECONDS ? CHUNK_SECONDS : 0,
    stride_length_s: audio.seconds > CHUNK_SECONDS ? STRIDE_SECONDS : undefined,
  });
  const output = Array.isArray(result) ? result[0] : result;
  ctx.report({ measured: "observed", calls: 1, model: MODEL_ID, compute: { wallMs: Math.round(performance.now() - started) } });

  const text = (output?.text ?? "").trim();
  const source = { model: MODEL_ID, seconds: Math.round(audio.seconds * 100) / 100, sourceRate: audio.sourceRate, channels: audio.channels, sampleRate: SAMPLE_RATE };
  const textRef = await ctx.artifacts.putBytes(new TextEncoder().encode(text), {
    type: "type-text",
    format: "format-plaintext",
    key: ctx.artifacts.key("runs", ctx.runId, ctx.stepKey, "transcript.txt"),
    meta: { ...source, chars: text.length, language: cfg.language ?? "english", task: cfg.task },
  });
  if (!cfg.timestamps) return { text: textRef, segments: { type: "type-structured-content" as const, value: [] } };

  const chunks = ((output as { chunks?: Chunk[] } | undefined)?.chunks ?? []) as Chunk[];
  const segments: Segment[] = chunks.map((c) => ({
    start: c.timestamp[0],
    ...(c.timestamp[1] === null ? {} : { end: c.timestamp[1] }),
    text: c.text.trim(),
  }));
  return { text: textRef, segments: { type: "type-structured-content" as const, value: segments } };
};
