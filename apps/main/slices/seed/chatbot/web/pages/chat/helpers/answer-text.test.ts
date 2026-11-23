import { describe, expect, it } from "vitest";

import { parseAnswer, parseSpans } from "./answer-text";

describe("parseAnswer", () => {
  it("makes a paragraph of each line and a list of consecutive items", () => {
    const text = "Borealis Labs has 2 members:\n- John Okafor, company owner\n- Samantha Reyes, company standard\n\nThat's all.";

    expect(parseAnswer(text)).toEqual([
      { kind: "paragraph", spans: [{ text: "Borealis Labs has 2 members:", bold: false }] },
      {
        kind: "list",
        ordered: false,
        items: [[{ text: "John Okafor, company owner", bold: false }], [{ text: "Samantha Reyes, company standard", bold: false }]],
      },
      { kind: "paragraph", spans: [{ text: "That's all.", bold: false }] },
    ]);
  });

  it("keeps numbered items as an ordered list", () => {
    const blocks = parseAnswer("1. First\n2) Second");
    expect(blocks).toEqual([
      { kind: "list", ordered: true, items: [[{ text: "First", bold: false }], [{ text: "Second", bold: false }]] },
    ]);
  });
});

describe("parseSpans", () => {
  it("splits bold spans", () => {
    expect(parseSpans("The largest is **Borealis Labs**, with 12.")).toEqual([
      { text: "The largest is ", bold: false },
      { text: "Borealis Labs", bold: true },
      { text: ", with 12.", bold: false },
    ]);
  });

  it("leaves an unclosed marker as text", () => {
    expect(parseSpans("a **b")).toEqual([{ text: "a **b", bold: false }]);
  });
});
