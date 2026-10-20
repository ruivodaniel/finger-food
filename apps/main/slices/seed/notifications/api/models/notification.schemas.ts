import { z } from "zod";
import { NOTIFICATION_CHANNELS } from "../../shared/types";

export const ListInboxQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  /** `createdAt` of the last row of the previous page (ISO). */
  cursor: z.string().optional(),
});
export type ListInboxQuery = z.infer<typeof ListInboxQuerySchema>;

export const SetPreferenceSchema = z.object({
  messageType: z.string().min(1),
  channel: z.enum(NOTIFICATION_CHANNELS),
  enabled: z.boolean(),
});
export type SetPreferenceInput = z.infer<typeof SetPreferenceSchema>;
