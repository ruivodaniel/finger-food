// Inferred from the model.
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { versionDelta } from "./version-delta.model";

export const VersionDeltaSchema = createSelectSchema(versionDelta);
export type VersionDelta = z.infer<typeof VersionDeltaSchema>;
