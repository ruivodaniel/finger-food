import { z } from "zod";

export const CreateInvitationSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
    roles: z.array(z.string().min(1)).min(1),
  })
  .refine((body) => !!body.email !== !!body.phone, {
    message: "provide exactly one of email or phone",
  });
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;

export const UpdateMemberRolesSchema = z.object({
  roles: z.array(z.string().min(1)).min(1),
});
export type UpdateMemberRolesInput = z.infer<typeof UpdateMemberRolesSchema>;
