/**
 * Browser upload mechanics shared by avatar/logo fields: validate the image,
 * fetch a presigned PUT from the given module endpoint, upload the bytes
 * straight to storage, and resolve to the object's durable public URL.
 *
 * Failures here are the person's to read (wrong file, too big, storage
 * unreachable or refusing), so they throw an UploadError whose message the
 * fields show as-is. The presign call's own failures stay ApiErrors.
 */

/** Client-side cap — a presigned PUT can't enforce size server-side. */
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export async function uploadImage(
  file: File,
  presign: (
    contentType: string,
  ) => Promise<{ uploadUrl: string; publicUrl: string }>,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new UploadError("Only images can be uploaded.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("The image is too large (max 2MB).");
  }

  const { uploadUrl, publicUrl } = await presign(file.type);
  let upload: Response;
  try {
    upload = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
  } catch {
    // The browser never got an answer — storage down, or refusing this origin.
    throw new UploadError("Couldn't reach file storage — the image wasn't uploaded.");
  }
  if (!upload.ok) {
    throw new UploadError(`File storage refused the upload (${upload.status}).`);
  }
  return publicUrl;
}
