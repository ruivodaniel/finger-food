import { z } from "zod";
import { type WorkerMeta, slot } from "@libs/orchestrator-lib-schema";

export const meta: WorkerMeta = { capability: "data-access", vendor: "open-api", operation: "HTTP requests to the open API, for the user main delegated", runtimes: ["server"] };

// The open API's HTTP requests, made for the user named by main's delegation.
// The worker knows no endpoint: the caller says which requests to make. Every
// status is an answer the caller reads; only a request that gets no answer
// fails the step.
export const config = z.object({
  /** per request */
  timeoutMs: z.number().int().positive().default(15_000),
});

const openApiRequest = z.object({
  /** the caller's key for the request's response */
  id: z.string().min(1),
  method: z.enum(["GET", "POST"]),
  path: z.string().startsWith("/"),
  query: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  body: z.unknown().optional(),
});

export const request = z.object({
  /** main's delegation: the only proof of whom the requests are for */
  delegation: z.string().min(1),
  requests: z.array(openApiRequest).min(1).max(100),
});

export const result = z.object({
  responses: z.array(z.object({ id: z.string(), status: z.number().int(), body: z.unknown() })),
});

/**
 * Where the open API is, and the orchestrator's Ed25519 private key (PKCS#8
 * PEM) that signs its own token for it. Server only: the key never leaves the
 * runner.
 */
export const deps = z.object({ openApiUrl: z.string().url(), privateKey: z.string().min(1) });

export const input = {
  request: slot("type-structured-content", { formats: ["format-json"], schema: request }),
};

export const output = {
  result: slot("type-structured-content", { formats: ["format-json"], schema: result }),
};

export type OpenApiRequest = z.infer<typeof openApiRequest>;
export type OpenApiResponse = z.infer<typeof result>["responses"][number];
