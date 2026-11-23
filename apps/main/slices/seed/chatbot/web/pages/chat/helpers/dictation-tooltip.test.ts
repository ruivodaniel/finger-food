import { describe, expect, it } from "vitest";
import { dictationButton } from "./dictation-tooltip";

describe("dictationButton", () => {
  it("is pressable at rest with the model ready, the tooltip on hover", () => {
    expect(dictationButton({ kind: "idle" }, "ready", false)).toEqual({ text: "Dictate in English", open: false, disabled: false });
  });

  it("is disabled while the model loads, saying so on hover", () => {
    expect(dictationButton({ kind: "idle" }, "loading", false)).toEqual({ text: "Loading the speech model…", open: false, disabled: true });
  });

  it("is pressable after a failed load: pressing tries again", () => {
    expect(dictationButton({ kind: "idle" }, "failed", false)).toMatchObject({ text: expect.stringContaining("could not load"), disabled: false });
  });

  it("stays pressable while recording (it is the stop), the tooltip on its own", () => {
    expect(dictationButton({ kind: "recording" }, "ready", false)).toMatchObject({ text: expect.stringContaining("Listening"), open: true, disabled: false });
  });

  it("is disabled while transcribing, the tooltip on its own", () => {
    expect(dictationButton({ kind: "transcribing" }, "ready", false)).toEqual({ text: "Transcribing…", open: true, disabled: true });
    expect(dictationButton({ kind: "transcribing" }, "loading", false).text).toBe("Loading the speech model, then transcribing…");
  });

  it("is disabled while the microphone is refused, the tooltip on its own only right after the refusal", () => {
    expect(dictationButton({ kind: "refused", fresh: true }, "ready", false)).toMatchObject({ text: expect.stringContaining("Microphone access was refused"), open: true, disabled: true });
    expect(dictationButton({ kind: "refused", fresh: false }, "ready", false)).toMatchObject({ open: false, disabled: true });
  });

  it("shows a failed dictation on its own and stays pressable", () => {
    expect(dictationButton({ kind: "failed", message: "No speech was heard." }, "ready", false)).toEqual({ text: "No speech was heard.", open: true, disabled: false });
  });

  it("is disabled while the assistant is answering, whatever else", () => {
    expect(dictationButton({ kind: "idle" }, "ready", true)).toEqual({ text: "The assistant is answering", open: false, disabled: true });
    expect(dictationButton({ kind: "failed", message: "x" }, "loading", true).disabled).toBe(true);
  });
});
