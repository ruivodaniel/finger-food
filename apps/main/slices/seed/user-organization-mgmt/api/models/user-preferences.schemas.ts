/**
 * /me/preferences request shape. Only the shape is checked here — whether a
 * value is valid and whether the field may change at all is the injected
 * policy's call, applied by the service.
 */

import { z } from "zod";

const BoundPreferenceSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("system") }),
  z.object({ source: z.literal("explicit"), value: z.string().min(1) }),
]);

export const UpdateUserPreferencesSchema = z
  .object({
    locale: BoundPreferenceSchema.optional(),
    timezone: BoundPreferenceSchema.optional(),
    currency: z.string().min(1).nullable().optional(),
    country: z.string().min(1).nullable().optional(),
  })
  .strict();
