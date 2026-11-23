// The request shapes the router validates.
import { z } from "zod";

export const DocumentParamsSchema = z.object({
  kind: z.string().min(1),
  id: z.string().min(1),
});

/** Whatever a client sends with an asked-for save: the kind's to read. */
export const SaveBodySchema = z.record(z.string(), z.unknown());

export const LeaseBodySchema = z.object({
  paths: z.array(z.array(z.string().min(1)).min(2)).min(1),
  action: z.enum(["acquire", "renew", "release"]),
  /** What is starting, in the host's word: what the rules are checked against. */
  operation: z.string().min(1).optional(),
});

export const SendChangesBodySchema = z.object({
  changes: z.array(z.object({
    opId: z.string().min(1),
    path: z.array(z.string()).min(2).max(3),
    before: z.unknown().optional(),
    after: z.unknown().optional(),
  })).min(1),
  /** Each change applies only if its path still holds its `before`, and the others go in without it. */
  ifUnchanged: z.boolean().optional(),
});

/** A document's lock, by its kind and id. */
export const LockParamsSchema = z.object({
  kind: z.string().min(1),
  documentId: z.string().min(1),
});

/** A page of locks: newest first. */
export const LockListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type LockListQuery = z.infer<typeof LockListQuerySchema>;

/** The documents of a kind whose locks are asked for: ids, comma-separated, a page's worth at most. */
export const LockKindParamsSchema = z.object({ kind: z.string().min(1) });
export const LocksOfQuerySchema = z.object({
  ids: z.string().transform((ids) => [...new Set(ids.split(",").map((id) => id.trim()).filter(Boolean))]).pipe(z.array(z.string()).max(100)),
});
