// Writes the folder audio-to-text-whisper v1 is served from (its `modelBaseUrl`):
//   <out>/onnx-community/whisper-tiny/resolve/<revision>/…  the pinned model files
//   <out>/onnxruntime-web/<version>/ort-wasm-simd-threaded…  the browser's ONNX Runtime
// The model files are downloaded once from Hugging Face and each is checked
// against the size and sha256 pinned in model.ts; ONNX Runtime's files are
// copied from the installed package. Upload or serve the folder as it is.
//
//   pnpm -C shared/libs/orchestrator/workers mirror:whisper <out dir>
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { MODEL, modelFilePath } from "../audio-to-text-whisper/v1/model";

const out = process.argv[2];
if (!out) {
  console.error("usage: pnpm mirror:whisper <out dir>");
  process.exit(1);
}

/** Stops with one line, not a stack: the caller (e.g. web's prepare step) shows it as is. */
function fail(message: string): never {
  console.error(`mirror:whisper: ${message}`);
  process.exit(1);
}

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

async function present(file: string, expected: { bytes: number; sha256: string }): Promise<boolean> {
  const s = await stat(file).catch(() => null);
  return !!s && s.size === expected.bytes && sha256(await readFile(file)) === expected.sha256;
}

for (const f of MODEL.files) {
  const target = path.join(out, modelFilePath(f.path));
  if (await present(target, f)) {
    console.log(`kept       ${modelFilePath(f.path)}`);
    continue;
  }
  const url = `https://huggingface.co/${MODEL.repo}/resolve/${MODEL.revision}/${f.path}`;
  const res = await fetch(url).catch((err: Error) => fail(`${url}: ${(err.cause as Error | undefined)?.message ?? err.message}`));
  if (!res.ok) fail(`${url}: HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength !== f.bytes || sha256(bytes) !== f.sha256) fail(`${f.path}: the download does not match the pinned size and sha256`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  console.log(`downloaded ${modelFilePath(f.path)} (${f.bytes} bytes)`);
}

// ONNX Runtime for the browser, the version transformers.js was installed with.
// transformers.js picks the asyncify build, or the plain one where asyncify does not run.
const fromTransformers = createRequire(createRequire(import.meta.url).resolve("@huggingface/transformers"));
const ortDir = path.dirname(path.dirname(fromTransformers.resolve("onnxruntime-web")));
const { version } = JSON.parse(await readFile(path.join(ortDir, "package.json"), "utf8")) as { version: string };
const runtimeDir = path.join(out, "onnxruntime-web", version);
await mkdir(runtimeDir, { recursive: true });
for (const file of ["ort-wasm-simd-threaded.asyncify.mjs", "ort-wasm-simd-threaded.asyncify.wasm", "ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) {
  const source = path.join(ortDir, "dist", file);
  const target = path.join(runtimeDir, file);
  if (await present(target, { bytes: (await stat(source)).size, sha256: sha256(await readFile(source)) })) {
    console.log(`kept       onnxruntime-web/${version}/${file}`);
    continue;
  }
  await copyFile(source, target);
  console.log(`copied     onnxruntime-web/${version}/${file}`);
}
