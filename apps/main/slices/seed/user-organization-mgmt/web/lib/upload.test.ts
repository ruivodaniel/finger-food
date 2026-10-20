// =============================================================================
// uploadImage — every failure is an UploadError a person can read: wrong
// file, too big, storage unreachable (fetch throws), storage refusing (!ok).
// =============================================================================

import { afterEach, describe, expect, it, vi } from "vitest";
import { UploadError, uploadImage } from "./upload";

const presign = async () => ({
  uploadUrl: "https://storage.test/put",
  publicUrl: "https://storage.test/logo.png",
});
const png = (bytes = 10) => new File([new Uint8Array(bytes)], "logo.png", { type: "image/png" });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadImage", () => {
  it("uploads and resolves to the public URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
    await expect(uploadImage(png(), presign)).resolves.toBe("https://storage.test/logo.png");
  });

  it("refuses non-images and oversized files before presigning", async () => {
    const text = new File(["x"], "notes.txt", { type: "text/plain" });
    await expect(uploadImage(text, presign)).rejects.toThrow(UploadError);
    await expect(uploadImage(png(2 * 1024 * 1024 + 1), presign)).rejects.toThrow(
      "The image is too large (max 2MB).",
    );
  });

  it("says storage couldn't be reached when the PUT never gets an answer", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }));
    await expect(uploadImage(png(), presign)).rejects.toThrow(
      "Couldn't reach file storage — the image wasn't uploaded.",
    );
  });

  it("says storage refused when the PUT is answered with an error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 403 })));
    await expect(uploadImage(png(), presign)).rejects.toThrow(
      "File storage refused the upload (403).",
    );
  });
});
