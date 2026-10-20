// Gate wire types — what the 428 body and resolve screens exchange.

import type { Obligation } from "../auth-config/resolver";

/** An obligation annotated with whether the caller currently meets it. */
export interface ObligationStatus {
  obligation: Obligation;
  met: boolean;
}

/** Body of a 428 gate block. */
export interface GateBlockBody {
  obligations: Obligation[];
}

export type GateCheckResult =
  | { status: "clear" }
  | { status: "blocked"; obligations: Obligation[] };
