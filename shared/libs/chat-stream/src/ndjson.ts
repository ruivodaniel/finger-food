/**
 * NDJSON: one JSON value per line. How the orchestrator writes a reply's
 * updates on the one request it keeps open to the open API, and how the open
 * API reads them as they arrive.
 */

/** One value as one NDJSON line. */
export function ndjsonLine(value: unknown): string {
  return JSON.stringify(value) + "\n";
}

/** A line or the whole body is longer than the reader accepts. */
export class NdjsonLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NdjsonLimitError";
  }
}

export interface NdjsonLimits {
  maxLineBytes: number;
  maxTotalBytes: number;
}

/**
 * Each line's value, parsed, as the line arrives; blank lines are skipped. The
 * limits keep a sender from making the reader buffer without end: one passed
 * throws NdjsonLimitError, and a line that is not JSON throws SyntaxError.
 */
export async function* readNdjson(body: ReadableStream<Uint8Array>, limits: NdjsonLimits): AsyncGenerator<unknown> {
  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buffer = "";
  let totalBytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > limits.maxTotalBytes) throw new NdjsonLimitError(`the body is longer than ${limits.maxTotalBytes} bytes`);
        buffer += decoder.decode(value, { stream: true });
      }
      if (done) buffer += decoder.decode();

      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (new TextEncoder().encode(line).byteLength > limits.maxLineBytes) {
          throw new NdjsonLimitError(`a line is longer than ${limits.maxLineBytes} bytes`);
        }
        if (line.trim()) yield JSON.parse(line) as unknown;
      }
      // a line still without its newline counts too, or it could grow without end
      if (new TextEncoder().encode(buffer).byteLength > limits.maxLineBytes) {
        throw new NdjsonLimitError(`a line is longer than ${limits.maxLineBytes} bytes`);
      }
      if (done) break;
    }
    if (buffer.trim()) yield JSON.parse(buffer) as unknown;
  } finally {
    reader.releaseLock();
  }
}
