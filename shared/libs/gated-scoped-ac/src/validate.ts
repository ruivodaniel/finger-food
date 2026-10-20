// The VALIDATION PORT.
//
// This library is central and long-lived, so it stays agnostic to the stack it
// runs on: it declares the shape check it wants and takes an ADAPTER. Nothing
// under src/ imports a validation library — swap zod for whatever comes next and
// only `src/adapters/zod.ts` changes. ("It should be an adapter, otherwise if we
// change zod one day it will break", 2026-07-10.)
//
// The port is deliberately tiny: exactly the two config shapes scoped AC reads.

export type Issue = { path: string; message: string };

export type ConfigValidator = {
  permission(def: unknown): Issue[];
  roleNode(node: unknown): Issue[];
};

// Config is loaded once at boot, so a bad shape is a startup crash, not a
// per-request error type.
export function assertNoIssues(label: string, issues: Issue[]): void {
  if (!issues.length) return;
  const lines = issues.map((i) => `  ${i.path || "(root)"}: ${i.message}`);
  throw new Error(`Invalid ${label}:\n${lines.join("\n")}`);
}
