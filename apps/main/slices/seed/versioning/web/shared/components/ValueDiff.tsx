// What became of one value: text word by word, removed words struck through in red and added ones in green. Anything else, old and new.
import type { ReactNode } from "react";
import { diffWords } from "../../../shared/word-diff";

const REMOVED_STYLE = { color: "#b3342f", background: "#fbe6e4", textDecoration: "line-through" };
const ADDED_STYLE = { color: "#1d7a4a", background: "#e3f6ec" };

const isText = (value: unknown) => typeof value === "string" || value === null || value === undefined;
const textOf = (value: unknown) => (value === null || value === undefined || value === "" ? "empty" : typeof value === "object" ? JSON.stringify(value) : String(value));

interface ValueDiffProps {
  from: unknown;
  to: unknown;
  /** How a value shows, when text alone wouldn't. */
  render?: (value: unknown) => ReactNode;
}

export function ValueDiff({ from, to, render }: ValueDiffProps) {
  if (render || !isText(from) || !isText(to)) {
    const show = render ?? textOf;
    return (
      <span element="type--body-small" data-testid="value-diff">
        <span style={REMOVED_STYLE}>{show(from)}</span>{" → "}<span style={ADDED_STYLE}>{show(to)}</span>
      </span>
    );
  }
  return (
    <span element="type--body-small" data-testid="value-diff" style={{ whiteSpace: "pre-wrap" }}>
      {diffWords(String(from ?? ""), String(to ?? "")).map((change, index) => (
        <span key={index} style={change.type === "removed" ? REMOVED_STYLE : change.type === "added" ? ADDED_STYLE : undefined}>{change.value}</span>
      ))}
    </span>
  );
}
