import { z } from "zod";

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  image: z.string().url().optional(),
  /** Config-driven fields (DSL data-field names) — validated per obligation. */
  data: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
