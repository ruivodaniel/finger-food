// Hono context variables the slice's routes read. The app's middlewares set
// them; the slice declares the narrowest shape that works.

import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";

export interface ImplementationPatternsContextVariables {
  scopedAc?: ScopedAcRequestContext;
}

export type ImplementationPatternsEnv = { Variables: ImplementationPatternsContextVariables };
