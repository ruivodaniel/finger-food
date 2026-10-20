import { z } from "zod";

export const CreateOrganizationSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  logo: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  logo: z.string().min(1).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
