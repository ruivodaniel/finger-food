/** The unmet-requirements gate: what the caller still owes before the app lets them in. */

import { queryOptions } from "@tanstack/react-query";
import { gateApi } from "../api/gate.api";

export type { GateCheckResponse } from "../api/gate.api";

const keys = {
  gate: ["uom", "gate"] as const,
};

export const onboardingService = {
  keys,
  evaluate: () => queryOptions({ queryKey: keys.gate, queryFn: () => gateApi.gateCheck() }),
};
