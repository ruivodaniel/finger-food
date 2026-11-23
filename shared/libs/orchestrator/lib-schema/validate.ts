/**
 * Validation before and after a run: type, format, cardinality and limits of
 * what arrives against the input slots; the produced value against the output
 * slots. Neither parses content; a schema on a slot checks an inline value.
 *
 * Only the API door looks files up (it passes `head`): each ref must exist, and
 * its size is filled in. Inside a run, a ref comes from the door or from a step
 * that just wrote it, so a step checks the shape and the size the ref carries.
 */

import type { z } from "zod";
import type { RunError } from "./envelope";
import { isRef, slotMapSchema, type Ref, type SlotMap } from "./slot";

type Head = (ref: string) => Promise<{ bytes: number } | null>;

function issueError(issues: z.ZodError["issues"], side: "input" | "output"): RunError {
  const first = issues[0];
  const path = first?.path.map(String).join(".") ?? "";
  const onFormat = first?.path.at(-1) === "format";
  return {
    code: onFormat && side === "input" ? "format_not_accepted" : side === "input" ? "input_invalid" : "output_invalid",
    message: `${side} ${path ? `"${path}" ` : ""}${first?.message ?? "invalid"}`,
    retryable: false,
    details: { issues: issues.slice(0, 10).map((i) => ({ path: i.path.map(String).join("."), message: i.message })) },
  };
}

function refsOf(slots: SlotMap, values: Record<string, unknown>): { slot: string; ref: Ref }[] {
  const out: { slot: string; ref: Ref }[] = [];
  for (const name of Object.keys(slots)) {
    const v = values[name];
    for (const item of Array.isArray(v) ? v : [v]) if (isRef(item)) out.push({ slot: name, ref: item });
  }
  return out;
}

/** Returns the error, or null and the values; with `head`, every ref's `bytes` is filled. */
export async function validateInput(
  slots: SlotMap,
  values: unknown,
  head?: Head,
): Promise<{ error: RunError } | { error: null; values: Record<string, unknown> }> {
  const parsed = slotMapSchema(slots).safeParse(values);
  if (!parsed.success) return { error: issueError(parsed.error.issues, "input") };

  for (const { slot, ref } of refsOf(slots, parsed.data)) {
    if (head) {
      const h = await head(ref.ref);
      if (!h) {
        return { error: { code: "ref_not_found", message: `input "${slot}": ${ref.ref} does not exist`, retryable: false } };
      }
      ref.bytes = h.bytes;
    }
    const max = slots[slot]?.limits["constraint-bytes"];
    if (max !== undefined && ref.bytes !== undefined && ref.bytes > max) {
      return {
        error: {
          code: "input_too_large",
          message: `input "${slot}" is ${ref.bytes} bytes, this slot accepts ${max}`,
          retryable: false,
          details: { "constraint-bytes": max, bytes: ref.bytes },
        },
      };
    }
  }
  return { error: null, values: parsed.data };
}

export function validateOutput(slots: SlotMap, values: unknown): { error: RunError } | { error: null; values: Record<string, unknown> } {
  const parsed = slotMapSchema(slots).safeParse(values);
  return parsed.success ? { error: null, values: parsed.data } : { error: issueError(parsed.error.issues, "output") };
}
