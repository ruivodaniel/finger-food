/** Audio as a WAV file: what dictation records and its transcription worker takes. */

/** Channels of samples in [-1, 1] as a 16-bit PCM WAV file. */
export function encodeWav(channels: readonly Float32Array[], rate: number): Uint8Array {
  const frames = channels[0]?.length ?? 0;
  const step = 2;
  const dataSize = frames * channels.length * step;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);
  const ascii = (at: number, text: string) => [...text].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  ascii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels.length, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * channels.length * step, true);
  view.setUint16(32, channels.length * step, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, dataSize, true);
  let at = 44;
  for (let f = 0; f < frames; f++) {
    for (const channel of channels) {
      const sample = Math.max(-1, Math.min(1, channel[f] ?? 0));
      view.setInt16(at, Math.round(sample * 32_767), true);
      at += step;
    }
  }
  return bytes;
}
