/**
 * Stable per-process identity for `workflow_intent.claimed_by`.
 *
 * The boot id is generated once at module load, so every task run this worker
 * executes shares one identity: the column names the WORKER that holds a claim,
 * not the individual run.
 */

import { randomUUID } from "crypto";
import { workflowIntentWorkerId } from "@libs/workflows";

const BOOT_ID = randomUUID();

export function getWorkerId(): string {
  return workflowIntentWorkerId({
    hostname: process.env.HOSTNAME ?? "prowd-api",
    pid: process.pid,
    bootId: BOOT_ID,
  });
}
