/**
 * @libs/storage — presigned browser uploads over S3-compatible storage.
 *
 * The lib holds the provider knowledge (S3 client quirks); it reads no env
 * and knows no product. The app instantiates it from its own config and
 * injects it into module storage ports at mount.
 */

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3StorageConfig {
  region: string;
  bucket: string;
  /** Explicit credentials (local dev / e2e). On EKS with IRSA the SDK resolves them itself. */
  accessKeyId?: string;
  secretAccessKey?: string;
  /** Custom endpoint (LocalStack). Forces path-style URLs. Unset in real AWS. */
  endpoint?: string;
}

export interface PresignedUpload {
  /** Short-lived signed PUT target — the browser uploads the bytes here. */
  uploadUrl: string;
  /** The object's durable URL (public-read bucket) — what the caller stores. */
  publicUrl: string;
}

export interface ObjectHead {
  bytes: number;
  contentType?: string;
}

export interface Storage {
  /**
   * Short-lived signed PUT. `contentLength` signs the exact size into the URL,
   * so S3 refuses a body of any other length.
   */
  presignPut(key: string, contentType: string, opts?: { contentLength?: number; ttlSeconds?: number }): Promise<PresignedUpload>;
  /** Short-lived signed GET for a private object. */
  presignGet(key: string, ttlSeconds?: number): Promise<string>;
  /** Server-side write — the orchestrator storing a derived artifact. */
  putObject(key: string, body: Uint8Array, contentType: string): Promise<void>;
  getObject(key: string): Promise<Uint8Array>;
  /** null when the object does not exist. */
  headObject(key: string): Promise<ObjectHead | null>;
}

export function createS3Storage(config: S3StorageConfig): Storage {
  const client = new S3Client({
    region: config.region,
    // Presigned PUTs are uploaded by the BROWSER: default integrity checksums
    // (SDK ≥3.729) would bake the checksum of an EMPTY body into the signed
    // query, and the real upload then fails validation.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    ...(config.accessKeyId &&
      config.secretAccessKey && {
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      }),
    forcePathStyle: !!config.endpoint,
    endpoint: config.endpoint,
  });

  return {
    async presignPut(key, contentType, opts) {
      const uploadUrl = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          ContentType: contentType,
          ...(opts?.contentLength !== undefined ? { ContentLength: opts.contentLength } : {}),
        }),
        { expiresIn: opts?.ttlSeconds ?? 900 },
      );
      const publicUrl = new URL(uploadUrl);
      publicUrl.search = "";
      publicUrl.hash = "";
      return { uploadUrl, publicUrl: publicUrl.toString() };
    },

    async presignGet(key, ttlSeconds = 900) {
      return getSignedUrl(client, new GetObjectCommand({ Bucket: config.bucket, Key: key }), {
        expiresIn: ttlSeconds,
      });
    },

    async putObject(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentLength: body.byteLength,
        }),
      );
    },

    async getObject(key) {
      const res = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
      if (!res.Body) return new Uint8Array();
      return res.Body.transformToByteArray();
    },

    async headObject(key) {
      try {
        const res = await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
        return { bytes: res.ContentLength ?? 0, contentType: res.ContentType };
      } catch (err) {
        const name = (err as { name?: string }).name; // boundary: AWS SDK error shape
        if (name === "NotFound" || name === "NoSuchKey") return null;
        throw err;
      }
    },
  };
}
