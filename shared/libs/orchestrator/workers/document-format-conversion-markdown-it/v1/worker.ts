// document-format-conversion × markdown-it: markdown to HTML, in process. A
// line break in the text stays a line break (breaks: true): the markdown made
// from a PDF keeps one line per text line, and joining them would merge them.
import MarkdownIt from "markdown-it";
import type { WorkerRun } from "@libs/orchestrator-lib-schema";
import type * as contract from "./contract";

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/** The first non-empty line, without markdown heading marks: a document's natural title. */
export function titleOf(markdown: string): string {
  const line = markdown.split("\n").find((l) => l.trim()) ?? "Document";
  return line.replace(/^#+\s*/, "").trim().slice(0, 120);
}

/** A standalone page: readable in a browser and plain enough for an agent. */
export function pageOf(body: string, title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>body{max-width:46rem;margin:2rem auto;padding:0 1rem;font:16px/1.55 system-ui,sans-serif;color:#1d2528}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:.3rem .5rem}</style>
</head>
<body>
${body}</body>
</html>
`;
}

export const run: WorkerRun<typeof contract> = async (input, cfg, ctx) => {
  const markdown = new TextDecoder().decode(await ctx.artifacts.getBytes(input.document));
  const started = performance.now();
  const body = new MarkdownIt({ html: false, linkify: true, breaks: true }).render(markdown);
  const html = cfg.page ? pageOf(body, cfg.title ?? titleOf(markdown)) : body;
  ctx.report({ measured: "observed", calls: 1, compute: { wallMs: Math.round(performance.now() - started) } });
  return {
    document: await ctx.artifacts.putBytes(new TextEncoder().encode(html), {
      format: "format-html",
      key: ctx.artifacts.key("runs", ctx.runId, ctx.stepKey, "document.html"),
      meta: { chars: html.length },
    }),
  };
};
