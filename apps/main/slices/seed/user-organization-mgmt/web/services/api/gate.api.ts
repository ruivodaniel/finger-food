import type { Obligation } from "../../../shared/auth-config/resolver";
import { clientUrl, probe } from "./http";

export type GateCheckResponse = { status: "clear" } | { obligations: Obligation[] };

export const gateApi = {
  gateCheck: (): Promise<GateCheckResponse> => probe(clientUrl("/gate/check")),
};
