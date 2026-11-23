import { z } from "zod";
import { type WorkerMeta, slot } from "@libs/orchestrator-lib-schema";

export const meta: WorkerMeta = {
  capability: "audio-to-text",
  vendor: "whisper",
  operation: "transformers.js automatic-speech-recognition, onnx-community/whisper-tiny q8 (ONNX Runtime: node, or WebAssembly in the browser)",
  runtimes: ["server", "client"],
};

// The model is pinned (model.ts): a different one is a new version. What the
// caller chooses is the language, the task and whether to get timed segments.
export const config = z.object({
  /**
   * the spoken language, as Whisper names it ("english", "portuguese") or its
   * code ("en", "pt"); absent = English. transformers.js does not detect the
   * language: audio in another language with none given comes out as a poor
   * English translation.
   */
  language: z.string().min(2).max(32).optional(),
  /** write down what is said, or translate it into English */
  task: z.enum(["transcribe", "translate"]).default("transcribe"),
  /** also return the text in timed segments (else `segments` is empty) */
  timestamps: z.boolean().default(false),
});

/**
 * Where the pinned model files are served from: our own host, in the Hugging
 * Face layout (`<modelBaseUrl>/<repo>/resolve/<revision>/<file>`). In the
 * browser, ONNX Runtime's WebAssembly comes from there too
 * (`<modelBaseUrl>/onnxruntime-web/<version>/`). scripts/mirror-whisper.ts
 * writes that folder. Not a secret: a browser runner holds it too.
 */
export const deps = z.object({ modelBaseUrl: z.string().url() });

/** The longest audio a step takes, in seconds. */
export const MAX_SECONDS = 600;

// WAV only: it decodes the same way in every runtime (wav.ts). Another format
// is converted to WAV first, by the caller or by a conversion worker.
export const input = {
  audio: slot({ formats: ["format-wav"], limits: { "constraint-bytes": 104_857_600, "constraint-duration": MAX_SECONDS } }),
};

export const segments = z.array(
  z.object({
    /** seconds from the start */
    start: z.number().min(0),
    /** seconds from the start; absent when the audio ends mid-segment */
    end: z.number().min(0).optional(),
    text: z.string(),
  }),
);

// segments is always there, empty unless the config asks for timestamps: one
// output shape for every config.
export const output = {
  text: slot("type-text", { formats: ["format-plaintext"] }),
  segments: slot("type-structured-content", { formats: ["format-json"], schema: segments }),
};

export type Segment = z.infer<typeof segments>[number];
