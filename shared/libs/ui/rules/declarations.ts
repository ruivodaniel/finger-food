// ── WHAT A COMPONENT DECLARES, read from its types ───────────────
// A component written as code declares what it may be given in its own types. This reads them, with the TypeScript compiler, so the declaration the check
// uses is the component's own and whole: nobody writes or keeps a list. Node only: this is how the file source knows a component; a source of rows gives the same from its rows.
import * as ts from "typescript";
import type { FileSource } from "../../check/file-source.ts";
import { componentFiles } from "./finders";

/** the kind of value a property takes: one of some words, a boolean, a number, a text, a template (a function the component calls to draw one of its items); `true`: anything else */
export type DeclaredKind = true | "string" | "number" | "boolean" | "template" | { enum: string[] };
/** what a component declares: the properties it may be given, the events it hands up (a property `onX` is the event `x`), and whether it holds content */
export type Declaration = { props: Record<string, DeclaredKind>; events: string[]; container: boolean };

const kindOf = (checker: ts.TypeChecker, type: ts.Type): DeclaredKind | "function" => {
  const parts = (type.isUnion() ? type.types : [type]).filter((t) => !(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)));
  if (!parts.length) return true;
  if (parts.every((t) => t.isStringLiteral())) return { enum: parts.map((t) => (t as ts.StringLiteralType).value) };
  if (parts.every((t) => t.flags & ts.TypeFlags.BooleanLike)) return "boolean";
  if (parts.every((t) => t.flags & ts.TypeFlags.NumberLike)) return "number";
  if (parts.every((t) => t.flags & ts.TypeFlags.StringLike)) return "string";
  if (parts.every((t) => checker.getSignaturesOfType(t, ts.SignatureKind.Call).length > 0)) return "function";
  return true;
};

/** the declarations of the library's components, by name and version. The compiler is started once, on the first component asked for */
export function declarationsOf(source: FileSource): (name: string, version?: number) => Declaration | undefined {
  let program: ts.Program | undefined;
  const done = new Map<string, Declaration | undefined>();
  const start = (): ts.Program => {
    if (program) return program;
    const files = componentFiles(source).map((id) => source.path(id));
    const config = ts.findConfigFile(source.path("shared/libs/ui/web"), ts.sys.fileExists);
    const options = config ? ts.parseJsonConfigFileContent(ts.readConfigFile(config, ts.sys.readFile).config, ts.sys, source.path("shared/libs/ui/web")).options : {};
    return (program = ts.createProgram(files, { ...options, noEmit: true, composite: false, incremental: false, skipLibCheck: true, declaration: false, declarationMap: false }));
  };
  return (name, version) => {
    const key = `${name}@${version ?? "latest"}`;
    if (done.has(key)) return done.get(key);
    let found: Declaration | undefined;
    const ids = source.find({ as: "component", name, version }, "");
    if (ids.length) {
      const p = start(), checker = p.getTypeChecker();
      for (const id of ids) {
        const sf = p.getSourceFile(source.path(id)), module = sf && checker.getSymbolAtLocation(sf);
        const symbol = module && checker.getExportsOfModule(module).find((s) => s.name === name);
        if (!sf || !symbol) continue;
        const type = checker.getTypeOfSymbolAtLocation(symbol, sf), call = checker.getSignaturesOfType(type, ts.SignatureKind.Call)[0];
        const given = call?.parameters[0] && checker.getTypeOfSymbolAtLocation(call.parameters[0], sf);
        if (!call) continue;
        const d: Declaration = { props: {}, events: [], container: false };
        for (const prop of given ? checker.getPropertiesOfType(checker.getApparentType(given)) : []) {
          const kind = kindOf(checker, checker.getTypeOfSymbolAtLocation(prop, sf));
          if (prop.name === "children") d.container = true;
          if (kind === "function" && /^on[A-Z]/.test(prop.name)) d.events.push(prop.name[2].toLowerCase() + prop.name.slice(3));
          else d.props[prop.name] = kind === "function" ? "template" : kind;
        }
        found = d; break;
      }
    }
    done.set(key, found);
    return found;
  };
}
