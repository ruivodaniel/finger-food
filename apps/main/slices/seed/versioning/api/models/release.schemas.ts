// Inferred from the model.
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { release } from "./release.model";

export const ReleaseSchema = createSelectSchema(release);
export type Release = z.infer<typeof ReleaseSchema>;
