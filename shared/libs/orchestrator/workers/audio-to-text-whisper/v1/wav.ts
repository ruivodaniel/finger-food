// WAV in, the samples Whisper takes out: mono, 16 kHz, 32-bit float in
// [-1, 1]. Plain TypeScript over a DataView, so it decodes the same way in
// node and in the browser (no AudioContext, no Buffer).

/** Whisper's sampling rate. */
export const SAMPLE_RATE = 16_000;

export interface DecodedWav {
  /** mono, at SAMPLE_RATE */
  samples: Float32Array;
  /** the source's own rate and channels, for the record */
  sourceRate: number;
  channels: number;
  seconds: number;
}

export class WavError extends Error {}

const PCM = 1;
const FLOAT = 3;
const EXTENSIBLE = 0xfffe;

function tag(view: DataView, at: number): string {
  return String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3));
}

/** Reads a RIFF/WAVE file: integer PCM (8, 16, 24 or 32 bit) or float (32 or 64 bit), any rate, any channels. */
export function decodeWav(bytes: Uint8Array): DecodedWav {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 12 || tag(view, 0) !== "RIFF" || tag(view, 8) !== "WAVE") throw new WavError("not a WAV file (no RIFF/WAVE header)");

  let format: { encoding: number; channels: number; rate: number; bits: number } | undefined;
  let data: { at: number; size: number } | undefined;
  for (let at = 12; at + 8 <= bytes.byteLength; ) {
    const id = tag(view, at);
    const size = view.getUint32(at + 4, true);
    const body = at + 8;
    if (id === "fmt ") {
      if (size < 16) throw new WavError("the fmt chunk is too short");
      let encoding = view.getUint16(body, true);
      // WAVE_FORMAT_EXTENSIBLE: the real encoding is the sub-format's first two bytes
      if (encoding === EXTENSIBLE && size >= 26) encoding = view.getUint16(body + 24, true);
      format = { encoding, channels: view.getUint16(body + 2, true), rate: view.getUint32(body + 4, true), bits: view.getUint16(body + 14, true) };
    } else if (id === "data") {
      // a streamed WAV may leave the size unset or too large: take what is there
      data = { at: body, size: Math.min(size, bytes.byteLength - body) };
    }
    if (format && data) break;
    at = body + size + (size % 2);
  }
  if (!format) throw new WavError("no fmt chunk");
  if (!data) throw new WavError("no data chunk");

  const { encoding, channels, rate, bits } = format;
  if (channels < 1 || rate < 1) throw new WavError(`a WAV with ${channels} channels at ${rate} Hz`);
  const read = sampleReader(view, encoding, bits);
  const step = bits / 8;
  const frames = Math.floor(data.size / (step * channels));

  // channels averaged into one
  const mono = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) sum += read(data.at + (f * channels + c) * step);
    mono[f] = sum / channels;
  }
  return { samples: resample(mono, rate, SAMPLE_RATE), sourceRate: rate, channels, seconds: frames / rate };
}

function sampleReader(view: DataView, encoding: number, bits: number): (at: number) => number {
  if (encoding === PCM) {
    if (bits === 8) return (at) => (view.getUint8(at) - 128) / 128;
    if (bits === 16) return (at) => view.getInt16(at, true) / 32_768;
    if (bits === 24) return (at) => ((view.getUint8(at) | (view.getUint8(at + 1) << 8) | (view.getInt8(at + 2) << 16)) / 8_388_608);
    if (bits === 32) return (at) => view.getInt32(at, true) / 2_147_483_648;
  }
  if (encoding === FLOAT) {
    if (bits === 32) return (at) => view.getFloat32(at, true);
    if (bits === 64) return (at) => view.getFloat64(at, true);
  }
  throw new WavError(`unsupported WAV encoding: format ${encoding}, ${bits} bits (PCM 8/16/24/32 or float 32/64 only)`);
}

/**
 * To `to` Hz. Down: each output sample averages the input samples it covers (a
 * box filter, enough to keep speech from aliasing). Up: linear interpolation.
 */
export function resample(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const length = Math.floor((input.length * to) / from);
  const out = new Float32Array(length);
  const ratio = from / to;
  if (ratio > 1) {
    for (let i = 0; i < length; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.min(input.length, Math.max(start + 1, Math.floor((i + 1) * ratio)));
      let sum = 0;
      for (let j = start; j < end; j++) sum += input[j]!;
      out[i] = sum / (end - start);
    }
  } else {
    for (let i = 0; i < length; i++) {
      const x = i * ratio;
      const j = Math.floor(x);
      const a = input[j] ?? 0;
      const b = input[j + 1] ?? a;
      out[i] = a + (b - a) * (x - j);
    }
  }
  return out;
}
