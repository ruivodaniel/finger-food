/**
 * Dictation's transcription, off the page's thread; dictation.service starts
 * it. The audio-to-text-whisper v1 worker run through runWorker, as the
 * orchestrator runs it, over bytes in memory. English only. The model loads
 * once (on "warm", when the chat page opens) and stays loaded for the life of
 * the page.
 */

import { createMemoryArtifacts, runWorker, type Logger, type Ref, type StepRecorder } from "@libs/orchestrator-lib-schema";
import * as whisper from "@libs/orchestrator-workers/audio-to-text-whisper/v1";

import { encodeWav } from "../../shared/helpers/wav";
import type { DictationReply, DictationRequest } from "./dictation.service";

const worker = { id: "audio-to-text-whisper", version: "v1", contract: whisper.contract, run: whisper.run };
const config = { language: "english", task: "transcribe", timestamps: false };

const quiet: Logger = { info: () => {}, warn: () => {}, error: () => {} };
const steps: StepRecorder = { recordStep: async () => {} };

/** One second of silence: running the model on it loads it and pays its first, slowest inference. */
const SILENCE = encodeWav([new Float32Array(16_000)], 16_000);

// A dedicated worker's scope, typed only as far as this file uses it.
const scope = self as unknown as {
  addEventListener(type: "message", listener: (event: MessageEvent<DictationRequest>) => void): void;
  postMessage(message: DictationReply): void;
};

scope.addEventListener("message", (event) => {
  const request = event.data;
  const wav = request.kind === "warm" ? SILENCE : request.wav;
  transcribe(request.id, wav, request.modelBaseUrl).then(
    // a warm-up's text is whatever the model makes of silence: not the caller's
    (reply) => scope.postMessage(request.kind === "warm" && reply.ok ? { ...reply, text: "" } : reply),
    (err: unknown) => scope.postMessage({ id: request.id, ok: false, message: err instanceof Error ? err.message : String(err) }),
  );
});

async function transcribe(id: string, wav: Uint8Array, modelBaseUrl: string): Promise<DictationReply> {
  const artifacts = createMemoryArtifacts("dictation");
  const audio = await artifacts.putBytes(wav, { format: "format-wav", key: artifacts.key(id, "audio.wav") });
  const envelope = await runWorker(worker, { audio }, config, { runId: id, stepKey: "dictation", artifacts, deps: { modelBaseUrl }, log: quiet }, steps);
  if (envelope.status === "error") return { id, ok: false, message: envelope.error.message };
  const { text } = envelope.output as { text: Ref };
  return { id, ok: true, text: new TextDecoder().decode(await artifacts.getBytes(text)) };
}
