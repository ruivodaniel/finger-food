// The request shapes the router validates. What is an entity's field comes from that entity's inferred schema; the rest is
// the route's own: which entity, which version, where it goes.
import { z } from "zod";
import { BranchSchema } from "./branch.schemas";
import { InnerCapsuleSchema } from "./inner-capsule.schemas";
import { OuterCapsuleSchema } from "./outer-capsule.schemas";
import { ReleaseSchema } from "./release.schemas";

/** A version, by its id. */
const VersionIdSchema = InnerCapsuleSchema.shape.id.min(1);

/** A branch is named by a caller: a name that says something. */
const BranchNameSchema = BranchSchema.shape.name.trim().min(1);

export const VersionedParamsSchema = z.object({
  entity: z.string().min(1),
  entityId: OuterCapsuleSchema.shape.entityId.min(1),
});

export const ArchiveBranchParamsSchema = VersionedParamsSchema.extend({
  name: BranchNameSchema,
});

export const VersionParamsSchema = VersionedParamsSchema.extend({
  versionId: VersionIdSchema,
});

export const ReadAtQuerySchema = z.object({
  branch: BranchNameSchema.optional(),
  /** ISO moment; absent means now */
  at: z.iso.datetime({ offset: true }).optional(),
});

export const CompareQuerySchema = z.object({
  from: VersionIdSchema,
  to: VersionIdSchema,
});

export const BranchHierarchyBodySchema = z.object({
  name: BranchNameSchema,
});

/** What a caller calls a release: its title and description. */
export const ReleaseBodySchema = z.object({
  /** a version of main */
  versionId: ReleaseSchema.shape.innerCapsuleId.min(1),
  title: ReleaseSchema.shape.title.unwrap().min(1).optional(),
  description: ReleaseSchema.shape.description.unwrap().min(1).optional(),
});

/** What a caller says of a version: what and why. */
const IntentSchema = z.object({
  what: InnerCapsuleSchema.shape.intentWhat.unwrap().optional(),
  why: InnerCapsuleSchema.shape.intentWhy.unwrap().optional(),
});

export const CloneBodySchema = z.object({
  /** the version to clone */
  from: VersionIdSchema,
  /** default main; created when it does not exist. The version's own branch is a restore */
  toBranch: BranchNameSchema.optional(),
  expectedHead: VersionIdSchema.optional(),
  intent: IntentSchema.optional(),
});

export const MergeBodySchema = z.object({
  sources: z.array(VersionIdSchema).min(2),
  /** default main */
  toBranch: BranchNameSchema.optional(),
  /** the values the caller chose */
  data: z.record(z.string(), z.unknown()),
  expectedHead: VersionIdSchema.optional(),
  intent: IntentSchema.optional(),
});
