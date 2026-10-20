/**
 * Legal-document HTML sanitizer.
 *
 * Client-submitted HTML is sanitized to a conservative allowlist before
 * storage; the stored HTML is the document's render source of record, served
 * to consent screens and viewers. The allowlist mirrors what the authoring
 * editor (`shared/libs/rich-text-editor`) can produce — no scripts, no event
 * handlers, no arbitrary attributes — and neutralizes
 * `<a href="javascript:...">` while forcing safe `rel` on links.
 */

import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "hr",
    "strong",
    "em",
    "u",
    "s",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "a",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

export function sanitizeLegalHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}
