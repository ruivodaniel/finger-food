import { z } from "zod";

// Strict: ID-only. .strict() ensures any extra field (potential PHI) throws.
export const notificationDispatchIntentSchema = z
  .object({ deliveryId: z.string().min(1) })
  .strict();

export type NotificationDispatchIntent = z.infer<
  typeof notificationDispatchIntentSchema
>;
