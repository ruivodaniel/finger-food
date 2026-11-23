// POST /api/m2m/workflow-intents/reconcile — one reconciler pass, on the
// orchestrator's schedule. Returns what the pass did.
import { Hono } from "hono";
import type { HonoContext } from "@/shared/context";
import { reconcileWorkflowIntents } from "@/wiring/intent-runner";

export const workflowIntentsM2mRouter = new Hono<HonoContext>().post("/workflow-intents/reconcile", async (c) =>
  c.json(await reconcileWorkflowIntents()),
);
