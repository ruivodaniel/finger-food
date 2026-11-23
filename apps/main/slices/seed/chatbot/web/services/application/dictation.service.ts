/**
 * Dictation: the microphone recorded on the page, transcribed in the browser
 * by the audio-to-text-whisper worker running in a Web Worker
 * (dictation.worker.ts). English only; the audio never leaves the browser.
 *
 * - The model loads once per page (`warm`, when the chat page opens) and
 *   stays loaded in the Web Worker. Requests are answered in order: a
 *   dictation stopped while the model is still loading waits for it.
 * - Recording uses MediaRecorder and is decoded on the page (browsers decode
 *   audio only there, not in a Web Worker) into the WAV the worker takes.
 */

import { encodeWav } from "../../shared/helpers/wav";

// ── The Web Worker's messages ────────────────────────────────────

export type DictationRequest =
  | { kind: "transcribe"; id: string; wav: Uint8Array; modelBaseUrl: string }
  /** loads the model; answered with an empty text */
  | { kind: "warm"; id: string; modelBaseUrl: string };

export type DictationReply = { id: string; ok: true; text: string } | { id: string; ok: false; message: string };

// ── Recording ────────────────────────────────────────────────────

export interface Recording {
  /** Stops the microphone; the recording comes back as WAV. */
  stop(): Promise<Uint8Array>;
  /** Stops the microphone and drops the recording. */
  cancel(): void;
}

/** Asks for the microphone and starts recording. Throws when the browser refuses it. */
export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const parts: Blob[] = [];
  const release = () => stream.getTracks().forEach((track) => track.stop());
  recorder.ondataavailable = (event) => parts.push(event.data);
  recorder.start();
  return {
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onstop = () => {
          release();
          new Blob(parts, { type: recorder.mimeType })
            .arrayBuffer()
            .then(toWav)
            .then(resolve, reject);
        };
        recorder.stop();
      }),
    cancel: () => {
      recorder.onstop = release;
      if (recorder.state !== "inactive") recorder.stop();
      else release();
    },
  };
}

/** Any audio the browser decodes, as WAV at its own rate. */
async function toWav(bytes: ArrayBuffer): Promise<Uint8Array> {
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(bytes);
    const channels = Array.from({ length: audio.numberOfChannels }, (_, c) => audio.getChannelData(c));
    return encodeWav(channels, audio.sampleRate);
  } finally {
    await context.close();
  }
}

// ── Transcription ────────────────────────────────────────────────

let worker: Worker | null = null;
let warming: { modelBaseUrl: string; done: Promise<void> } | null = null;
const pending = new Map<string, { resolve: (text: string) => void; reject: (err: Error) => void }>();

function start(): Worker {
  const started = new Worker(new URL("./dictation.worker.ts", import.meta.url), { type: "module", name: "dictation" });
  started.addEventListener("message", (event: MessageEvent<DictationReply>) => {
    const reply = event.data;
    const waiting = pending.get(reply.id);
    pending.delete(reply.id);
    if (reply.ok) waiting?.resolve(reply.text);
    else waiting?.reject(new Error(reply.message));
  });
  started.addEventListener("error", (event) => {
    // the worker could not start or crashed: fail what is waiting, start afresh next time
    for (const waiting of pending.values()) waiting.reject(new Error(event.message || "the transcription worker stopped"));
    pending.clear();
    worker = null;
    warming = null;
  });
  return started;
}

function send(request: DictationRequest, transfer: Transferable[] = []): Promise<string> {
  worker ??= start();
  return new Promise((resolve, reject) => {
    pending.set(request.id, { resolve, reject });
    worker!.postMessage(request, transfer);
  });
}

/** Loads the model (once per page): resolves when the first dictation will be quick. */
export function warm(modelBaseUrl: string): Promise<void> {
  if (warming?.modelBaseUrl !== modelBaseUrl) {
    const done = send({ kind: "warm", id: crypto.randomUUID(), modelBaseUrl }).then(() => undefined);
    // a failed load is not kept: the next warm or dictation tries again
    done.catch(() => {
      if (warming?.done === done) warming = null;
    });
    warming = { modelBaseUrl, done };
  }
  return warming.done;
}

/** The transcript of a WAV file, in English. */
export function transcribe(wav: Uint8Array, modelBaseUrl: string): Promise<string> {
  return send({ kind: "transcribe", id: crypto.randomUUID(), wav, modelBaseUrl }, [wav.buffer]);
}
