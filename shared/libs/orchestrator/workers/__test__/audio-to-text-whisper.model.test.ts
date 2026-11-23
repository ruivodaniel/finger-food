// The real model, on node, from a self-hosted copy: opt-in, because it reads
// ~40 MB. Write the copy once, then point the test at it:
//
//   pnpm mirror:whisper /tmp/whisper-mirror
//   WHISPER_MODEL_DIR=/tmp/whisper-mirror pnpm vitest run audio-to-text-whisper.model
//
// The test serves the folder on a local port and starts from an empty cache:
// it passes only if that server served every pinned file, so nothing came
// from anywhere else.
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { env } from "@huggingface/transformers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MODEL, modelFilePath } from "../audio-to-text-whisper/v1/model";
import { run } from "../audio-to-text-whisper/v1/worker";
import { makeCtx, putUpload } from "./harness";

const DIR = process.env.WHISPER_MODEL_DIR;

describe.skipIf(!DIR)("audio-to-text-whisper with the real model", () => {
  let server: Server;
  let base: string;
  const served: string[] = [];

  beforeAll(async () => {
    server = createServer(async (req, res) => {
      const file = path.join(DIR!, decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname));
      const s = await stat(file).catch(() => null);
      if (!s?.isFile() || !file.startsWith(path.resolve(DIR!))) return void res.writeHead(404).end();
      served.push(path.relative(DIR!, file));
      res.writeHead(200, { "Content-Length": s.size });
      createReadStream(file).pipe(res);
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
    // an empty cache, so every file has to be fetched
    env.cacheDir = await mkdtemp(path.join(os.tmpdir(), "whisper-cache-"));
  });

  afterAll(() => {
    server?.close();
  });

  it("transcribes the spoken fixture, fetching nothing but our host", { timeout: 120_000 }, async () => {
    const { ctx, artifacts } = await makeCtx({ modelBaseUrl: base });
    const audio = await putUpload(artifacts, "speech.wav", new Uint8Array(await readFile(path.resolve(__dirname, "fixtures/speech.wav"))), "format-wav");

    const out = await run({ audio }, { language: "english", task: "transcribe", timestamps: true }, ctx);

    const text = new TextDecoder().decode(artifacts.objects.get(out.text.ref));
    expect(text.toLowerCase()).toContain("quick brown fox jumps over the lazy dog");
    expect("value" in out.segments && out.segments.value.length).toBeGreaterThan(0);
    expect(new Set(served)).toEqual(new Set(MODEL.files.map((f) => modelFilePath(f.path))));
  });
});
