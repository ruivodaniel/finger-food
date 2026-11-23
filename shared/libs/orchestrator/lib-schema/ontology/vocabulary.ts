/**
 * The vocabulary: the kinds of content (types), the files that carry them
 * (formats) and the limits a slot can put on them (constraints). Trimmed and
 * linked from capability ontology v0.6 (canonical-vocabulary). Closed and
 * small: media kinds only. Structured content is one type whose shape is a Zod
 * schema on the slot. No document type: a document is a format.
 *
 * Changes vs v0.6: dropped type-binary, type-text-document,
 * type-multimedia-document and type-interactive; added format-plaintext, -html,
 * -xml, -base64, -pptx, -doc and -odt; each format names the types it carries
 * (packages), each type what it can contain and its constraint dimensions.
 *
 * `as const`, so every id is a type: a contract that names an unknown id fails
 * the build.
 */

export const CONSTRAINTS = {
  "constraint-bytes": { label: "Bytes", definition: "Size of the artifact in bytes." },
  "constraint-tokens": { label: "Tokens", definition: "Length of text in model tokens." },
  "constraint-pages": { label: "Pages", definition: "Number of pages." },
  "constraint-duration": { label: "Duration", definition: "Length of audio or video in seconds." },
  "constraint-width": { label: "Width", definition: "Width in pixels." },
  "constraint-height": { label: "Height", definition: "Height in pixels." },
  "constraint-items": { label: "Items", definition: "Number of items in a collection, rows in a table." },
} as const;
export type ConstraintId = keyof typeof CONSTRAINTS;

export const TYPES = {
  "type-text": { label: "Text", definition: "Textual content independent of encoding.", contains: [], constraints: ["constraint-bytes", "constraint-tokens"] },
  "type-image": { label: "Image", definition: "A raster or vector picture. It can contain text, tables, visualizations and picture regions.", contains: ["type-text", "type-table", "type-visualization", "type-image"], constraints: ["constraint-bytes", "constraint-width", "constraint-height"] },
  "type-audio": { label: "Audio", definition: "Audio independent of codec.", contains: [], constraints: ["constraint-bytes", "constraint-duration"] },
  "type-video": { label: "Video", definition: "Frames, an audio track, and possibly captions.", contains: ["type-image", "type-audio", "type-text"], constraints: ["constraint-bytes", "constraint-duration", "constraint-width", "constraint-height"] },
  "type-table": { label: "Table", definition: "Rows, columns and cells; the cells hold text.", contains: ["type-text"], constraints: ["constraint-items"] },
  "type-visualization": { label: "Visualization", definition: "A chart, graph or diagram; its labels are text.", contains: ["type-text"], constraints: ["constraint-bytes"] },
  "type-structured-content": { label: "Structured content", definition: "Content described by a schema. The shape itself is a Zod schema on the slot, not a vocabulary type.", contains: [], constraints: ["constraint-bytes", "constraint-items"] },
} as const satisfies Record<string, { label: string; definition: string; contains: readonly string[]; constraints: readonly ConstraintId[] }>;
export type TypeId = keyof typeof TYPES;

const DOCUMENT = ["type-text", "type-image", "type-table", "type-visualization"] as const;

export const FORMATS = {
  "format-pdf": { label: "PDF", packages: DOCUMENT, mime: "application/pdf", extensions: [".pdf"] },
  "format-docx": { label: "DOCX", packages: DOCUMENT, mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extensions: [".docx"] },
  "format-doc": { label: "DOC", packages: DOCUMENT, mime: "application/msword", extensions: [".doc"] },
  "format-odt": { label: "ODT", packages: DOCUMENT, mime: "application/vnd.oasis.opendocument.text", extensions: [".odt"] },
  "format-pptx": { label: "PPTX", packages: [...DOCUMENT, "type-audio", "type-video"], mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extensions: [".pptx"] },
  "format-html": { label: "HTML", packages: DOCUMENT, mime: "text/html; charset=utf-8", extensions: [".html", ".htm"] },
  "format-markdown": { label: "Markdown", packages: ["type-text"], mime: "text/markdown; charset=utf-8", extensions: [".md"] },
  "format-plaintext": { label: "Plain text", packages: ["type-text"], mime: "text/plain; charset=utf-8", extensions: [".txt"] },
  "format-xml": { label: "XML", packages: ["type-structured-content", "type-text", "type-table"], mime: "application/xml", extensions: [".xml"] },
  "format-json": { label: "JSON", packages: ["type-structured-content", "type-text", "type-table"], mime: "application/json", extensions: [".json"] },
  "format-base64": { label: "Base64", packages: ["type-image", "type-audio", "type-video"], mime: "text/plain", extensions: [] },
  "format-png": { label: "PNG", packages: ["type-image"], mime: "image/png", extensions: [".png"] },
  "format-jpeg": { label: "JPEG", packages: ["type-image"], mime: "image/jpeg", extensions: [".jpg", ".jpeg"] },
  "format-webp": { label: "WebP", packages: ["type-image"], mime: "image/webp", extensions: [".webp"] },
  "format-mp4": { label: "MP4", packages: ["type-video", "type-audio"], mime: "video/mp4", extensions: [".mp4"] },
  "format-mp3": { label: "MP3", packages: ["type-audio"], mime: "audio/mpeg", extensions: [".mp3"] },
  "format-wav": { label: "WAV", packages: ["type-audio"], mime: "audio/wav", extensions: [".wav"] },
} as const satisfies Record<string, { label: string; packages: readonly TypeId[]; mime: string; extensions: readonly string[] }>;
export type FormatId = keyof typeof FORMATS;

/** The types a format carries, at the type level. */
export type CarriedBy<F extends FormatId> = (typeof FORMATS)[F]["packages"][number];

// Object.keys, keeping the key type: the objects above are closed (as const).
function ids<K extends string>(o: Record<K, unknown>): K[] {
  const out: K[] = [];
  for (const k in o) out.push(k);
  return out;
}
export const TYPE_IDS = ids(TYPES);
export const FORMAT_IDS = ids(FORMATS);
export const CONSTRAINT_IDS = ids(CONSTRAINTS);

/** The types a format carries. */
export const typesOf = (format: FormatId): readonly TypeId[] => FORMATS[format].packages;

const extensions = (format: FormatId): readonly string[] => FORMATS[format].extensions;

/** The preferred file extension of a format (the first listed); base64 has none. */
export const extensionOf = (format: FormatId): string => extensions(format)[0] ?? "";

/** ".pdf" → format-pdf; lower-case, with the dot. */
export const FORMAT_BY_EXTENSION = new Map<string, FormatId>(FORMAT_IDS.flatMap((f) => extensions(f).map((ext) => [ext, f] as const)));
