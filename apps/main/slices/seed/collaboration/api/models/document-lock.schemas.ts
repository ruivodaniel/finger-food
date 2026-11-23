// Inferred from the model.
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { documentLock } from "./document-lock.model";

export const DocumentLockSchema = createSelectSchema(documentLock);
export type DocumentLock = z.infer<typeof DocumentLockSchema>;
