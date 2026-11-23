// ── PROCESSOR · contract ─────────────────────────────────────────
// What an item passes to a thing it names must be what that thing declares. It knows nothing of what the things are: the resolver gives the contract,
// a rule says the facet (the properties, the events, the slots…) and the words.
//   exists     the thing named exists, at the version named
//   declared   everything passed in a facet is declared by the thing
//   value      a value written in the item fits the kind the thing declares for it
//   only       each thing passed in a facet is one the thing takes, with a value it takes
//   own-name   a thing the item defines for itself does not take a name the registry owns
import { z } from "zod";
import { defineProcessor, type Found } from "./processor.ts";

/** the kind of value a declared name takes; `true`: any */
export type ValueKind = true | "string" | "number" | "boolean" | "node" | { enum: string[] };
/** what a thing declares in one facet. `open`: names it does not list are allowed. `unruled`: it declares nothing yet, so nothing can be said */
export type Declared = { names: Record<string, ValueKind>; open?: boolean; unruled?: boolean };
/** the contract of a thing, by facet */
export type Contract = Record<string, Declared>;

/** `as`: the uses the rule is about, by how the item names the thing; absent: every use. Messages: {name} the thing, {version}, {passed} what is passed, {kind}, {values} */
const base = { as: z.string().optional() };
export const ContractParams = z.discriminatedUnion("check", [
  z.strictObject({ ...base, check: z.literal("exists"), message: z.string(), /** said when the thing exists and the version named does not */ version: z.string().optional() }),
  z.strictObject({ ...base, check: z.literal("declared"), facet: z.string(), message: z.string(),
    /** names every thing may be passed */ allow: z.array(z.string()).optional(), allowPattern: z.string().optional(),
    /** said, as a thing no rule covers yet, when the thing declares nothing in this facet */ unruled: z.string().optional() }),
  z.strictObject({ ...base, check: z.literal("value"), facet: z.string(), /** by the kind declared: string, number, boolean, node, enum */ messages: z.record(z.string(), z.string()) }),
  /** a thing the item defines for itself does not take a name the registry owns. {name} */
  z.strictObject({ ...base, check: z.literal("own-name"), message: z.string() }),
  /** each thing passed in the facet is one the thing takes, with a value it takes. {passed} {value} {values}. A thing that declares nothing in the facet is not judged */
  z.strictObject({ ...base, check: z.literal("only"), facet: z.string(), message: z.string(), value: z.string() }),
]);
export type ContractParams = z.infer<typeof ContractParams>;

const say = (message: string, names: Record<string, string>) => message.replace(/\{(\w+)\}/g, (all, k: string) => names[k] ?? all);

/** `view`: what the resolver gives for a name → its contract, or undefined when there is no such thing */
export const contractProcessor = (view: (resolved: unknown) => Contract | undefined) => defineProcessor({
  name: "contract",
  params: ContractParams,
  run(work, { resolve }) {
    const out: Found[] = [];
    for (const { item, rules } of work) for (const use of item.facts?.uses ?? []) {
      const contract = view(resolve({ as: use.as, name: use.name, version: use.version, in: use.in, from: use.from, by: item.id }));
      for (const rule of rules) {
        const p = rule.params!;
        if (p.as !== undefined && p.as !== use.as) continue;
        const names = { name: use.name, version: String(use.version ?? "") };
        if (p.check === "own-name") {
          // what the item defines itself comes from nowhere; the registry is asked for the name alone
          if (use.from === undefined && use.in === "code" && view(resolve({ as: use.as, name: use.name, in: "registry", by: item.id }))) out.push({ rule: rule.id, item: item.id, at: use.at, subject: use.name, message: say(p.message, names) });
          continue;
        }
        if (p.check === "exists") {
          if (contract) continue;
          const anyVersion = use.version !== undefined && p.version ? view(resolve({ as: use.as, name: use.name, in: use.in, from: use.from, by: item.id })) : undefined;
          out.push({ rule: rule.id, item: item.id, at: use.at, message: say(anyVersion ? p.version! : p.message, names) });
          continue;
        }
        const declared = contract?.[p.facet];
        if (!declared) continue;
        for (const passed of use.passes[p.facet] ?? []) {
          const kind = declared.names[passed.name];
          if (p.check === "only") {
            if (declared.unruled) continue;
            if (kind === undefined) out.push({ rule: rule.id, item: item.id, at: passed.at ?? use.at, subject: passed.name, message: say(p.message, { ...names, passed: passed.name }) });
            else if (typeof kind === "object" && passed.value !== undefined && passed.type === "string" && !kind.enum.includes(passed.value)) out.push({ rule: rule.id, item: item.id, at: passed.at ?? use.at, subject: passed.name, message: say(p.value, { ...names, passed: passed.name, value: passed.value, values: kind.enum.join(", ") }) });
          } else if (p.check === "declared") {
            if (kind !== undefined || declared.open || p.allow?.includes(passed.name) || (p.allowPattern && new RegExp(p.allowPattern).test(passed.name))) continue;
            if (declared.unruled) { if (p.unruled) out.push({ rule: rule.id, item: item.id, at: passed.at ?? use.at, message: say(p.unruled, { ...names, passed: passed.name }), severity: "info" }); }
            else out.push({ rule: rule.id, item: item.id, at: passed.at ?? use.at, message: say(p.message, { ...names, passed: passed.name }) });
          } else if (kind !== undefined && kind !== true && passed.type !== undefined) {
            // a value that is computed is not judged, but where a node is declared, only a node fits
            if (kind !== "node" && ["expression", "node", "nodes"].includes(passed.type)) continue;
            const wanted = typeof kind === "string" ? kind : "enum";
            const fits = typeof kind === "string" ? passed.type === kind : passed.value !== undefined && kind.enum.includes(passed.value);
            if (!fits && p.messages[wanted]) out.push({ rule: rule.id, item: item.id, at: passed.at ?? use.at, message: say(p.messages[wanted], { ...names, passed: passed.name, kind: wanted, values: typeof kind === "string" ? "" : kind.enum.join(", ") }) });
          }
        }
      }
    }
    return out;
  },
});
