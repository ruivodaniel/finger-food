import { z } from "zod";

export const smokeIntentSchema = z.object({
  smokeId: z.string().min(1, "smokeId is required"),
}).strict();

export type SmokeIntentPayload = z.infer<typeof smokeIntentSchema>;
