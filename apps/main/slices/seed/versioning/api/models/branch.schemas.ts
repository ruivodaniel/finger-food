// Inferred from the model.
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { branch } from "./branch.model";

export const BranchSchema = createSelectSchema(branch);
export type Branch = z.infer<typeof BranchSchema>;
