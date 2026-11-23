/**
 * Dictation for the composer: the speech model loads as soon as the chat page
 * opens, so the first dictation is quick; then record, stop, transcribe in the
 * browser and hand the text back. English only. Unavailable (no button) when
 * the app gives no model location or the browser cannot record.
 *
 * A refused microphone lasts as long as the browser refuses it: the hook
 * watches the microphone permission where the browser exposes it, and the
 * button comes back when the user allows it.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { DictationState, ModelState } from "../helpers/dictation-tooltip";
import {
  startRecording,
  transcribe,
  warm,
  type Recording,
} from "../../../services/application/dictation.service";
import { mounted } from "../../../services/application/mount";

export interface Dictation {
  available: boolean;
  state: DictationState;
  model: ModelState;
  /** Starts recording, or stops it and transcribes. */
  toggle: () => void;
}

/** How long a failure (or a refusal just made) shows on its own. */
const SHOW_MS = 5_000;

// The model stays loaded in the Web Worker for the life of the page.
let modelReady = false;

function canRecord(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

function refused(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "NotAllowedError" || err.name === "SecurityError")
  );
}

function failure(err: unknown): string {
  if (err instanceof DOMException && err.name === "NotFoundError")
    return "No microphone was found.";
  return "Dictation failed. Try again, or type your message.";
}

/** The browser's microphone permission, where it says it (not every browser does). */
async function microphonePermission(): Promise<PermissionStatus | null> {
  try {
    return (
      (await navigator.permissions?.query({
        name: "microphone" as PermissionName,
      })) ?? null
    );
  } catch {
    return null;
  }
}

export function useDictation(onText: (text: string) => void): Dictation {
  const modelBaseUrl = mounted().dictation?.modelBaseUrl;
  const available = !!modelBaseUrl && canRecord();
  const [state, setState] = useState<DictationState>({ kind: "idle" });
  const [model, setModel] = useState<ModelState>(
    modelReady ? "ready" : "loading",
  );
  const permission = useRef<PermissionStatus | null>(null);
  const recording = useRef<Recording | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const load = useCallback(() => {
    if (!modelBaseUrl) return;
    setModel(modelReady ? "ready" : "loading");
    warm(modelBaseUrl).then(
      () => {
        modelReady = true;
        setModel("ready");
      },
      () => setModel("failed"),
    );
  }, [modelBaseUrl]);

  // the model loads when the page opens, not on the first dictation
  useEffect(() => {
    if (available) load();
  }, [available, load]);

  // a microphone the browser already refuses disables the button from the start; allowing it brings it back
  useEffect(() => {
    if (!available) return;
    let status: PermissionStatus | null = null;
    let live = true;
    const follow = () => {
      if (!status) return;
      if (status.state === "denied")
        setState((s) =>
          s.kind === "refused" ? s : { kind: "refused", fresh: false },
        );
      else setState((s) => (s.kind === "refused" ? { kind: "idle" } : s));
    };
    microphonePermission().then((found) => {
      if (!live || !found) return;
      status = found;
      permission.current = found;
      follow();
      status.addEventListener("change", follow);
    });
    return () => {
      live = false;
      status?.removeEventListener("change", follow);
      permission.current = null;
    };
  }, [available]);

  // leaving the page stops the microphone
  useEffect(() => () => recording.current?.cancel(), []);

  // a failure shows for a while, then the button goes back to rest. A refusal shows for a while too,
  // then stays (disabled) only while the browser's permission says "denied": a dismissed prompt, or a
  // browser that does not say, refuses that one attempt and the next may be allowed
  useEffect(() => {
    if (state.kind !== "failed" && !(state.kind === "refused" && state.fresh))
      return;
    const timer = setTimeout(
      () =>
        setState(
          state.kind === "refused" && permission.current?.state === "denied"
            ? { kind: "refused", fresh: false }
            : { kind: "idle" },
        ),
      SHOW_MS,
    );
    return () => clearTimeout(timer);
  }, [state]);

  const toggle = useCallback(() => {
    if (!modelBaseUrl) return;
    if (!recording.current) {
      if (model === "failed") load();
      startRecording().then(
        (started) => {
          recording.current = started;
          setState({ kind: "recording" });
        },
        (err: unknown) =>
          setState(
            refused(err)
              ? { kind: "refused", fresh: true }
              : { kind: "failed", message: failure(err) },
          ),
      );
      return;
    }
    const stopping = recording.current;
    recording.current = null;
    setState({ kind: "transcribing" });
    (async () => {
      const wav = await stopping.stop();
      const text = (await transcribe(wav, modelBaseUrl)).trim();
      modelReady = true;
      setModel("ready");
      if (!text)
        return setState({ kind: "failed", message: "No speech was heard." });
      onTextRef.current(text);
      setState({ kind: "idle" });
    })().catch((err: unknown) =>
      setState({ kind: "failed", message: failure(err) }),
    );
  }, [modelBaseUrl, model, load]);

  return { available, state, model, toggle };
}
