/**
 * In-memory storage port double — presigns deterministic fake URLs.
 */

import type { StoragePort } from "../shared/storage-port";

export function createFakeStorage(): StoragePort & {
  presigned: Array<{ key: string; contentType: string }>;
} {
  const presigned: Array<{ key: string; contentType: string }> = [];
  return {
    presigned,
    async presignPut(key, contentType) {
      presigned.push({ key, contentType });
      return {
        uploadUrl: `https://storage.test/${key}?signature=fake`,
        publicUrl: `https://storage.test/${key}`,
      };
    },
  };
}
