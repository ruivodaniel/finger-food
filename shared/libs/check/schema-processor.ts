// ── PROCESSOR · schema ───────────────────────────────────────────
// A value against a data schema: the shape of what is stored as a row (a theme, a UI document, any artifact). The rule names the schema;
// the system gives the schemas by name. A data schema is anything that says what is wrong with a value.
import { z } from "zod";
import { defineProcessor, type Found, type Resolve } from "./processor.ts";

export type DataIssue = { at?: string; message: string; /** a narrower rule of the same processor this issue belongs to, when the rule set has one */ rule?: string; severity?: "error" | "warn" | "info" };
export type DataSchema = { name: string; check(value: unknown, context: { item: string; resolve: Resolve }): DataIssue[] };

/** a zod schema as a data schema: a value that fits none of several shapes is reported with the shape it is closest to */
/** `at`: how a path in the value is written; joined by dots when absent */
export function fromZod(name: string, schemaFor: (value: unknown) => z.ZodType, at: (path: readonly PropertyKey[]) => string = (path) => path.join(".")): DataSchema {
  type Issue = z.core.$ZodIssue;
  const flatten = (issues: readonly Issue[], out: Issue[] = []): Issue[] => {
    for (const i of issues) {
      if (i.code === "invalid_union" && i.errors.length) { const closest = [...i.errors].sort((a, b) => a.length - b.length)[0]; flatten(closest.map((e) => ({ ...e, path: [...i.path, ...e.path] })), out); }
      else out.push(i);
    }
    return out;
  };
  const valueAt = (value: unknown, path: readonly PropertyKey[]) => path.reduce<unknown>((v, k) => (v as Record<PropertyKey, unknown> | undefined)?.[k], value);
  return {
    name,
    check(value) {
      const r = schemaFor(value).safeParse(value);
      if (r.success) return [];
      return flatten(r.error.issues).map((i) => {
        const got = i.code === "unrecognized_keys" ? undefined : valueAt(value, i.path);
        const shown = got === undefined || typeof got === "object" ? "" : ` (${JSON.stringify(got)})`;
        return { at: at(i.path), message: `${i.message}${shown}` };
      });
    },
  };
}

export const schemaProcessor = (schemas: readonly DataSchema[]) => {
  const byName = new Map(schemas.map((s) => [s.name, s]));
  return defineProcessor({
    name: "schema",
    params: z.strictObject({ schema: z.enum(schemas.map((s) => s.name) as [string, ...string[]]) }),
    run(work, context) {
      const out: Found[] = [];
      for (const { item, rules } of work) {
        // each schema is run once on an item; an issue goes to the narrower rule it names when that rule applies here, else to the schema's own rule
        for (const name of new Set(rules.map((r) => r.params!.schema))) {
          const own = rules.find((r) => r.params!.schema === name)!;
          for (const i of byName.get(name)!.check(item.value, { item: item.id, resolve: context.resolve })) {
            const rule = i.rule && rules.some((r) => r.id === i.rule) ? i.rule : i.rule ? undefined : own.id;
            if (rule) out.push({ rule, item: item.id, at: i.at, message: i.message, severity: i.severity });
          }
        }
      }
      return out;
    },
  });
};
