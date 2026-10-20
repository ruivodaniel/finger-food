/**
 * Storage port — the module's narrow view of the app's object storage,
 * injected at mount (like errors/logger/senders). The module derives keys
 * and authorizes; the app owns the provider (@libs/storage in the seed).
 */

export interface StoragePort {
  presignPut(
    key: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; publicUrl: string }>;
}

/** Image types the module accepts for avatars/logos. */
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** The file extension for an accepted image content type, or null. */
export function imageExtensionOf(contentType: string): string | null {
  return IMAGE_EXTENSIONS[contentType] ?? null;
}
