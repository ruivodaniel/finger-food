import { describe, expect, it } from "vitest";
import { appendDictation } from "./dictation-draft";

describe("appendDictation", () => {
  it("fills an empty draft with the dictated text, trimmed", () => {
    expect(appendDictation("", "  Show me the members of Acme.  ", 100)).toBe("Show me the members of Acme.");
  });

  it("adds after what is written, with one space, or none after a space or a new line", () => {
    expect(appendDictation("Hello.", "Show me Acme.", 100)).toBe("Hello. Show me Acme.");
    expect(appendDictation("Hello. ", "Show me Acme.", 100)).toBe("Hello. Show me Acme.");
    expect(appendDictation("Hello.\n", "Show me Acme.", 100)).toBe("Hello.\nShow me Acme.");
  });

  it("leaves the draft as it is when nothing was heard", () => {
    expect(appendDictation("Hello.", "   ", 100)).toBe("Hello.");
  });

  it("stops at the message's length limit", () => {
    expect(appendDictation("12345", "67890", 8)).toBe("12345 67");
  });
});
