// audio-to-text-whisper v1 with transformers.js stubbed: the WAV decoding, where
// the model and ONNX Runtime are fetched from, and what the worker writes.
// The real model runs in audio-to-text-whisper.model.test.ts (opt-in).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { EnvelopeError } from "@libs/orchestrator-lib-schema";
import { makeCtx, putUpload } from "./harness";

const stub = vi.hoisted(() => {
  const cdn = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.2.3/dist/";
  return {
    env: {
      remoteHost: "https://huggingface.co/",
      remotePathTemplate: "{model}/resolve/{revision}/",
      allowLocalModels: true,
      allowRemoteModels: true,
      backends: { onnx: { versions: { web: "1.2.3" }, wasm: { wasmPaths: { mjs: `${cdn}ort-wasm-simd-threaded.asyncify.mjs`, wasm: `${cdn}ort-wasm-simd-threaded.asyncify.wasm` } as unknown } } },
    },
    pipeline: vi.fn(),
    asr: vi.fn(),
  };
});
vi.mock("@huggingface/transformers", () => ({ env: stub.env, pipeline: stub.pipeline }));

const { run, loadModel } = await import("../audio-to-text-whisper/v1/worker");
const { decodeWav, resample, SAMPLE_RATE } = await import("../audio-to-text-whisper/v1/wav");
const { MODEL, modelFilePath } = await import("../audio-to-text-whisper/v1/model");

const SPEECH = path.resolve(__dirname, "fixtures/speech.wav");

/** A WAV file from mono or interleaved samples in [-1, 1]. */
function wav(samples: number[], opts: { rate?: number; channels?: number; bits?: 8 | 16 | 24 | 32; float?: boolean; extensible?: boolean } = {}): Uint8Array {
  const { rate = 16_000, channels = 1, bits = 16, float = false, extensible = false } = opts;
  const step = bits / 8;
  const fmtSize = extensible ? 40 : 16;
  const dataSize = samples.length * step;
  const bytes = new Uint8Array(12 + 8 + fmtSize + 8 + dataSize);
  const v = new DataView(bytes.buffer);
  const ascii = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  ascii(0, "RIFF");
  v.setUint32(4, bytes.length - 8, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  v.setUint32(16, fmtSize, true);
  const encoding = float ? 3 : 1;
  v.setUint16(20, extensible ? 0xfffe : encoding, true);
  v.setUint16(22, channels, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * channels * step, true);
  v.setUint16(32, channels * step, true);
  v.setUint16(34, bits, true);
  if (extensible) {
    v.setUint16(36, 22, true);
    v.setUint16(44, encoding, true);
  }
  const data = 20 + fmtSize;
  ascii(data, "data");
  v.setUint32(data + 4, dataSize, true);
  samples.forEach((s, i) => {
    const at = data + 8 + i * step;
    if (float) v.setFloat32(at, s, true);
    else if (bits === 8) v.setUint8(at, Math.round(s * 127) + 128);
    else if (bits === 16) v.setInt16(at, Math.round(s * 32_767), true);
    else if (bits === 24) {
      const n = Math.round(s * 8_388_607);
      v.setUint8(at, n & 0xff);
      v.setUint8(at + 1, (n >> 8) & 0xff);
      v.setInt8(at + 2, n >> 16);
    } else v.setInt32(at, Math.round(s * 2_147_483_647), true);
  });
  return bytes;
}

describe("decodeWav", () => {
  it.each([8, 16, 24, 32] as const)("reads %i-bit PCM", (bits) => {
    const out = decodeWav(wav([0, 0.5, -0.5, 1], { bits }));
    expect(Array.from(out.samples)).toEqual([0, 0.5, -0.5, 1].map((x) => expect.closeTo(x, 1)));
    expect(out.seconds).toBe(4 / 16_000);
  });

  it("reads 32-bit float, and the extensible header", () => {
    expect(Array.from(decodeWav(wav([0.25, -0.75], { float: true, bits: 32 })).samples)).toEqual([0.25, -0.75]);
    expect(Array.from(decodeWav(wav([0.25, -0.75], { float: true, bits: 32, extensible: true })).samples)).toEqual([0.25, -0.75]);
  });

  it("averages the channels into one", () => {
    // two frames: (1, 0) and (0.5, -0.5)
    expect(Array.from(decodeWav(wav([1, 0, 0.5, -0.5], { channels: 2, float: true, bits: 32 })).samples)).toEqual([0.5, 0]);
  });

  it("brings any rate to 16 kHz", () => {
    const second = (rate: number) => wav(Array.from({ length: rate }, () => 0.1), { rate });
    for (const rate of [8_000, 22_050, 44_100, 48_000]) {
      const out = decodeWav(second(rate));
      expect(out.samples.length).toBe(SAMPLE_RATE);
      expect(out.sourceRate).toBe(rate);
      expect(out.samples[100]).toBeCloseTo(0.1, 3);
    }
    expect(resample(new Float32Array([0, 1]), 8_000, 16_000)).toEqual(new Float32Array([0, 0.5, 1, 1]));
  });

  it("refuses what is not a WAV it can read", () => {
    expect(() => decodeWav(new TextEncoder().encode("ID3 not a wav"))).toThrow("not a WAV file");
    expect(() => decodeWav(wav([0], { bits: 16 }).slice(0, 36))).toThrow("no data chunk");
  });

  it("reads the spoken fixture: 16-bit mono at 16 kHz, under 3 seconds", async () => {
    const out = decodeWav(new Uint8Array(await readFile(SPEECH)));
    expect(out).toMatchObject({ sourceRate: 16_000, channels: 1 });
    expect(out.seconds).toBeGreaterThan(2);
    expect(out.seconds).toBeLessThan(3);
  });
});

describe("audio-to-text-whisper", () => {
  const cfg = { task: "transcribe" as const, timestamps: false };

  it("loads the pinned model from our host only, ONNX Runtime included", async () => {
    stub.pipeline.mockResolvedValue(stub.asr);
    await loadModel("http://models.test/base");

    expect(stub.env.remoteHost).toBe("http://models.test/base/");
    expect(stub.env.allowLocalModels).toBe(false);
    // every read lands in the pinned folder, a revision-less one included
    expect(stub.env.remotePathTemplate).toBe(`{model}/resolve/${MODEL.revision}/`);
    expect(stub.pipeline).toHaveBeenCalledWith("automatic-speech-recognition", "onnx-community/whisper-tiny", { revision: MODEL.revision, dtype: "q8" });
    // transformers.js's own choice of build, moved to our host
    expect(stub.env.backends.onnx.wasm.wasmPaths).toEqual({
      mjs: "http://models.test/base/onnxruntime-web/1.2.3/ort-wasm-simd-threaded.asyncify.mjs",
      wasm: "http://models.test/base/onnxruntime-web/1.2.3/ort-wasm-simd-threaded.asyncify.wasm",
    });
    expect(modelFilePath("config.json")).toBe(`onnx-community/whisper-tiny/resolve/${MODEL.revision}/config.json`);
  });

  it("loads the model once per base URL, and again after a failed load", async () => {
    stub.pipeline.mockClear().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(stub.asr);
    await expect(loadModel("http://once.test/")).rejects.toThrow("offline");
    await loadModel("http://once.test/");
    await loadModel("http://once.test/");
    expect(stub.pipeline).toHaveBeenCalledTimes(2);
  });

  it("transcribes a WAV to a plaintext artifact, with no segments unless asked", async () => {
    stub.pipeline.mockResolvedValue(stub.asr);
    stub.asr.mockReset().mockResolvedValue({ text: "  The quick brown fox.  " });
    const { ctx, artifacts, reports } = await makeCtx({ modelBaseUrl: "http://models.test/" });
    const audio = await putUpload(artifacts, "speech.wav", new Uint8Array(await readFile(SPEECH)), "format-wav");

    const out = await run({ audio }, { ...cfg, language: "english" }, ctx);

    expect(new TextDecoder().decode(artifacts.objects.get(out.text.ref))).toBe("The quick brown fox.");
    expect(out.text).toMatchObject({ type: "type-text", format: "format-plaintext", meta: { model: "onnx-community/whisper-tiny@ff41770", language: "english", task: "transcribe", channels: 1 } });
    expect(out.segments).toEqual({ type: "type-structured-content", value: [] });
    const [samples, options] = stub.asr.mock.calls[0]!;
    expect(samples).toBeInstanceOf(Float32Array);
    expect(options).toMatchObject({ language: "english", task: "transcribe", return_timestamps: false, chunk_length_s: 0 });
    expect(reports).toEqual([expect.objectContaining({ measured: "observed", calls: 1, model: "onnx-community/whisper-tiny@ff41770" })]);
  });

  it("returns timed segments when asked, and cuts long audio into 30-second windows", async () => {
    stub.pipeline.mockResolvedValue(stub.asr);
    stub.asr.mockReset().mockResolvedValue({ text: " one two", chunks: [{ timestamp: [0, 1.5], text: " one" }, { timestamp: [1.5, null], text: " two" }] });
    const { ctx, artifacts } = await makeCtx({ modelBaseUrl: "http://models.test/" });
    const audio = await putUpload(artifacts, "long.wav", wav(new Array(16_000 * 45).fill(0)), "format-wav");

    const out = await run({ audio }, { ...cfg, timestamps: true }, ctx);

    expect("value" in out.segments && out.segments.value).toEqual([{ start: 0, end: 1.5, text: "one" }, { start: 1.5, text: "two" }]);
    expect(stub.asr.mock.calls[0]![1]).toMatchObject({ return_timestamps: true, chunk_length_s: 30, stride_length_s: 5, language: undefined });
  });

  it("refuses audio it cannot read, and audio over 10 minutes, as input_invalid", async () => {
    const { ctx, artifacts } = await makeCtx({ modelBaseUrl: "http://models.test/" });
    const bad = await putUpload(artifacts, "bad.wav", new TextEncoder().encode("not audio"), "format-wav");
    const long = await putUpload(artifacts, "long.wav", wav(new Array(8_000 * 601).fill(0), { rate: 8_000, bits: 8 }), "format-wav");

    const refused = async (audio: typeof bad) => {
      const err = await run({ audio }, cfg, ctx).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(EnvelopeError);
      return (err as EnvelopeError).error;
    };
    expect(await refused(bad)).toMatchObject({ code: "input_invalid", message: expect.stringContaining("not a WAV file") });
    expect(await refused(long)).toMatchObject({ code: "input_invalid", details: { "constraint-duration": 600 } });
  });
});
