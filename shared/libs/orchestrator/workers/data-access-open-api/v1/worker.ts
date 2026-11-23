// The open API's HTTP requests for the delegated user, all at once.
import pLimit from "p-limit";
import { request } from "../../lib/open-api";
import type { WorkerRun } from "@libs/orchestrator-lib-schema";
import type * as contract from "./contract";

/** How many requests are in flight at once. */
const CONCURRENCY = 10;

export const run: WorkerRun<typeof contract> = async (input, cfg, ctx) => {
  if (!("value" in input.request)) throw new Error("the request must be sent inline");
  const { delegation, requests } = input.request.value;
  const openApi = { OPEN_API_URL: ctx.deps.openApiUrl, ORCHESTRATOR_PRIVATE_KEY: ctx.deps.privateKey };
  const limit = pLimit(CONCURRENCY);
  const started = performance.now();

  const responses = await Promise.all(
    requests.map(({ id, ...req }) => limit(async () => ({ id, ...(await request(openApi, delegation, req, cfg.timeoutMs)) }))),
  );

  ctx.report({ measured: "observed", calls: requests.length, compute: { wallMs: Math.round(performance.now() - started) } });
  return { result: { type: "type-structured-content", value: { responses } } };
};
