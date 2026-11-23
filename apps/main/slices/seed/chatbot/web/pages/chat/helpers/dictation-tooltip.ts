/**
 * The microphone button's tooltip and whether the button can be pressed.
 *
 * Disabled while it cannot do anything useful: the assistant is answering, the
 * speech model is still loading, a dictation is being transcribed, or the
 * browser refuses the microphone. The tooltip says why, on hover; it also
 * shows on its own while recording, while transcribing and right after a
 * failure, when the user needs to see it without hovering.
 */

export type ModelState = "loading" | "ready" | "failed";

export type DictationState =
  | { kind: "idle" }
  | { kind: "recording" }
  | { kind: "transcribing" }
  /** a dictation that went wrong; the next one may work */
  | { kind: "failed"; message: string }
  /** the browser refuses the microphone, until the user allows it; `fresh` while the refusal has just happened */
  | { kind: "refused"; fresh: boolean };

export interface DictationButton {
  text: string;
  /** the tooltip shows without hover */
  open: boolean;
  disabled: boolean;
}

export function dictationButton(state: DictationState, model: ModelState, answering: boolean): DictationButton {
  if (answering && state.kind !== "recording") return { text: "The assistant is answering", open: false, disabled: true };
  switch (state.kind) {
    case "recording":
      return { text: "Listening. Press to stop; the text goes into your message, not sent.", open: true, disabled: false };
    case "transcribing":
      return { text: model === "ready" ? "Transcribing…" : "Loading the speech model, then transcribing…", open: true, disabled: true };
    case "refused":
      return { text: "Microphone access was refused. Allow it in your browser's site settings to dictate.", open: state.fresh, disabled: true };
    case "failed":
      return { text: state.message, open: true, disabled: false };
    case "idle":
      if (model === "loading") return { text: "Loading the speech model…", open: false, disabled: true };
      if (model === "failed") return { text: "The speech model could not load. Press to try again.", open: false, disabled: false };
      return { text: "Dictate in English", open: false, disabled: false };
  }
}
