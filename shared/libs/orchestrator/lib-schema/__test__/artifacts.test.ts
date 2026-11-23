import { describe, expect, it } from "vitest";
import { createMemoryArtifacts } from "..";

describe("createMemoryArtifacts", () => {
  it("keeps bytes under its own prefix and hands back a ref the slot types", async () => {
    const artifacts = createMemoryArtifacts("browser");
    const key = artifacts.key("run", "audio.wav");
    const ref = await artifacts.putBytes(new Uint8Array([1, 2, 3]), { format: "format-wav", key, meta: { seconds: 1 } });

    expect(key).toBe("browser/run/audio.wav");
    expect(ref).toEqual({ type: "type-audio", format: "format-wav", ref: key, bytes: 3, meta: { seconds: 1 } });
    expect(await artifacts.getBytes(ref)).toEqual(new Uint8Array([1, 2, 3]));
    await expect(artifacts.getBytes({ ...ref, ref: "browser/other" })).rejects.toThrow("no object browser/other");
  });
});
