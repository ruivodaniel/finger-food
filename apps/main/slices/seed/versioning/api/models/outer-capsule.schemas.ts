// Inferred from the model.
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { outerCapsule } from "./outer-capsule.model";

export const OuterCapsuleSchema = createSelectSchema(outerCapsule);
export type OuterCapsule = z.infer<typeof OuterCapsuleSchema>;
