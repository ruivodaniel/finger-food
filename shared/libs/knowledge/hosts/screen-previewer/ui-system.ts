// THE UI IN THE CHECK SYSTEM, as the tests of this host run it: the storage is the repository's files, a module is loaded by the bundler,
// and what a component declares is read from its own types.
import { join } from "node:path";
import { fileSource } from "../../../check/file-source";
import { uiFinders, uiWhat } from "../../../ui/rules/finders";
import { uiSystem } from "../../../ui/rules/system";
import { declarationsOf } from "../../../ui/rules/declarations";
import { KNOWLEDGE_PRIMS } from "../../hosted-prims";

export const repo = join(__dirname, "../../../../..");
/** where the runs are kept */
export const RUNS = join(repo, "shared/libs/check/runs");

const source = fileSource(repo, { load: (path) => import(/* @vite-ignore */ path), finders: uiFinders, what: uiWhat });
export const system = await uiSystem({ source, hosted: KNOWLEDGE_PRIMS, declared: declarationsOf(source) });

/** what the rules of a group find in UI documents in hand (made in a test, or about to be written): each by its name. The documents given resolve each other's names */
export async function findingsIn(documents: readonly { name: string; kind: string; document: unknown }[], groups: readonly string[]): Promise<Record<string, string[]>> {
  const { checkValues } = await import("../../../check");
  const report = await checkValues(documents.map((d) => ({ id: d.name, kind: "data", value: { id: d.name, ...d } })), system, { groups });
  return Object.fromEntries(documents.map((d) => [d.name, report.findings.filter((f) => f.item === d.name && f.severity !== "info").map((f) => f.message)]));
}
