import { describe, expect, it } from "vitest";
import { encodeWav } from "./wav";

/** The fields of a 16-bit PCM WAV header, and its samples back in [-1, 1]. */
function read(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (at: number) => String.fromCharCode(...bytes.slice(at, at + 4));
  const samples: number[] = [];
  for (let at = 44; at < bytes.length; at += 2) samples.push(view.getInt16(at, true) / 32_767);
  return {
    riff: tag(0),
    wave: tag(8),
    encoding: view.getUint16(20, true),
    channels: view.getUint16(22, true),
    rate: view.getUint32(24, true),
    bits: view.getUint16(34, true),
    dataSize: view.getUint32(40, true),
    samples,
  };
}

describe("encodeWav", () => {
  it("writes a 16-bit PCM WAV at the recording's rate", () => {
    const wav = read(encodeWav([new Float32Array([0, 0.5, -0.5, 1])], 48_000));
    expect(wav).toMatchObject({ riff: "RIFF", wave: "WAVE", encoding: 1, channels: 1, rate: 48_000, bits: 16, dataSize: 8 });
    expect(wav.samples).toEqual([0, 0.5, -0.5, 1].map((x) => expect.closeTo(x, 3)));
  });

  it("interleaves the channels and clips what is out of range", () => {
    const wav = read(encodeWav([new Float32Array([1.5, 0]), new Float32Array([-2, 0.25])], 16_000));
    expect(wav.channels).toBe(2);
    expect(wav.samples).toEqual([1, -1, 0, 0.25].map((x) => expect.closeTo(x, 3)));
  });
});
