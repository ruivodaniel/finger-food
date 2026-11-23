/**
 * Inferred from the model; the diffs below are the only hand-written part —
 * what a caller may set.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { meteor } from "./meteor.model";

export const MeteorSchema = createSelectSchema(meteor);
export type Meteor = z.infer<typeof MeteorSchema>;

/** Server-owned fields leave; the caller sets the rest. */
export const CreateMeteorSchema = createInsertSchema(meteor)
  .omit({ id: true, organizationId: true, createdBy: true, status: true, createdAt: true, updatedAt: true })
  .extend({ name: z.string().min(1) });
export type CreateMeteorInput = z.infer<typeof CreateMeteorSchema>;

/** Any subset, status included: publish is `{ status: "published" }`. */
export const UpdateMeteorSchema = CreateMeteorSchema.extend({ status: MeteorSchema.shape.status }).partial();
export type UpdateMeteorInput = z.infer<typeof UpdateMeteorSchema>;

export const MeteorListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type MeteorListQuery = z.infer<typeof MeteorListQuerySchema>;
