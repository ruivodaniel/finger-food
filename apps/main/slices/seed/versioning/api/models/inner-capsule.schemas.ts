// Inferred from the model.
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { innerCapsule } from "./inner-capsule.model";

export const InnerCapsuleSchema = createSelectSchema(innerCapsule);
export type InnerCapsule = z.infer<typeof InnerCapsuleSchema>;
