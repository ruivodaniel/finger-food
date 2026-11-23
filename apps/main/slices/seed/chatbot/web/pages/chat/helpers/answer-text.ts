/**
 * An answer's text as blocks the thread renders: paragraphs and lists, with
 * bold spans (**like this**). The model writes plain text with a little
 * markdown; anything else stays as written.
 */

export interface Span {
  text: string;
  bold: boolean;
}

export type AnswerBlock =
  | { kind: "paragraph"; spans: Span[] }
  | { kind: "list"; ordered: boolean; items: Span[][] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function parseAnswer(text: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];

  for (const line of text.split("\n")) {
    if (!line.trim()) continue;

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const item = bullet ?? numbered;

    if (!item) {
      blocks.push({ kind: "paragraph", spans: parseSpans(line.trim()) });
      continue;
    }

    // Consecutive items of the same kind make one list.
    const ordered = !!numbered;
    const last = blocks.at(-1);
    if (last?.kind === "list" && last.ordered === ordered) {
      last.items.push(parseSpans(item[1]));
    } else {
      blocks.push({ kind: "list", ordered, items: [parseSpans(item[1])] });
    }
  }

  return blocks;
}

/** Splits a line on **bold** markers; an unclosed marker stays as text. */
export function parseSpans(line: string): Span[] {
  return line
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}
