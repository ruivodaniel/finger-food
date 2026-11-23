/**
 * The worker contract: what a worker version declares about itself.
 *
 * `contract.ts` in a worker version folder exports `meta`, `config`, `input`
 * and `output`; the folder names the id and version. The output may be a
 * function of the config (a Tesseract worker returns text or hOCR by config).
 *
 * Only the declaration lives here. Running a worker (its context, the step
 * recorder) belongs to whoever runs it.
 */

import type { z } from "zod";
import type { CapabilityId } from "./ontology/capabilities";
import type { SlotMap } from "./slot";

export type ConfigSchema = z.ZodObject<z.ZodRawShape>;

/** What a worker version is, beyond its folder: the capability it implements and the vendor doing the work. */
/**
 * Where a worker version may run: "server" (the orchestrator) and "client"
 * (the browser). A version declares "client" only when it needs nothing a
 * browser lacks (no node, no binary, no secret in its deps); the frontend may
 * import only those.
 */
export const RUNTIMES = ["server", "client"] as const;
export type Runtime = (typeof RUNTIMES)[number];

export interface WorkerMeta {
  capability: CapabilityId;
  vendor: string;
  /** the call made to the vendor, in a line */
  operation?: string;
  /** written inline as a literal: the frontend lint control reads it from the source */
  runtimes: readonly [Runtime, ...Runtime[]];
}

/**
 * What a worker needs from whoever runs it and the caller does not choose: a
 * vendor's key and address, a binary's path. Declared, so a worker never
 * reads its runner's environment and a runner hands over only these.
 */
export type DepsSchema = z.ZodObject<z.ZodRawShape>;

/**
 * What every contract module satisfies. The output function takes `never` so
 * a function of any specific config is assignable; the runtime calls it with
 * the parsed config of that same contract.
 */
export interface AnyWorkerContract {
  readonly meta: WorkerMeta;
  readonly config: ConfigSchema;
  /** absent = the worker needs nothing from its runner */
  readonly deps?: DepsSchema;
  readonly input: SlotMap;
  readonly output: SlotMap | ((cfg: never) => SlotMap);
}

/** The parsed deps a worker receives; `undefined` when its contract declares none. */
export type DepsOf<W> = W extends { deps: infer D extends DepsSchema } ? z.infer<D> : undefined;
/** What a runner supplies for a worker's deps, before parsing (defaults may fill the rest). */
export type DepsInputOf<W> = W extends { deps: infer D extends DepsSchema } ? z.input<D> : undefined;

export type OutputSlots<W extends AnyWorkerContract> = Extract<
  W["output"] extends (cfg: never) => infer O ? O : W["output"],
  SlotMap
>;
export type ConfigOf<W extends AnyWorkerContract> = z.infer<W["config"]>;

/** The output slots for a given parsed config. */
export function resolveOutput(output: AnyWorkerContract["output"], cfg: unknown): SlotMap {
  return typeof output === "function" ? output(cfg as never) : output;
}
