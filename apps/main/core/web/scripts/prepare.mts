#!/usr/bin/env tsx
/**
 * Puts on disk what the web app needs before it runs and that is not in git
 * (downloaded, copied or generated). `pnpm dev` runs it first.
 *
 * Every step is idempotent and cheap when nothing changed. An optional step
 * that fails only warns: the app starts, and what depends on it degrades. A
 * required step that fails stops. `--strict` makes every failure stop (for a
 * build or deploy, where a missing asset must not ship).
 *
 * Usage:
 *   tsx scripts/prepare.mts            # what `pnpm prepare:assets` runs
 *   tsx scripts/prepare.mts --strict
 */

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(WEB, "../../../..");

interface Step {
  name: string;
  /** a failure warns instead of stopping (unless --strict) */
  optional: boolean;
  /** what goes wrong in the app without it */
  without: string;
  /** throws on failure */
  run: () => void;
}

/** Runs a command with its output passed through; throws when it fails. */
function exec(command: string, args: string[]): void {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} exited with ${result.status}`);
}

const steps: Step[] = [
  {
    name: "dictation model",
    optional: true,
    without: "the chat's microphone says the speech model could not load",
    // the speech model and ONNX Runtime, served at /models/ in development
    run: () => exec("pnpm", ["-C", resolve(REPO, "shared/libs/orchestrator/workers"), "mirror:whisper", resolve(WEB, "public/models")]),
  },
];

const strict = process.argv.includes("--strict");
let failed = false;

for (const step of steps) {
  console.log(`\n▸ ${step.name}`);
  try {
    step.run();
    console.log(`✓ ${step.name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (step.optional && !strict) {
      console.warn(`⚠ ${step.name} skipped: ${message}\n  Without it ${step.without}.`);
    } else {
      console.error(`✗ ${step.name} failed: ${message}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
