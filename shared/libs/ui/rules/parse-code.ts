// PARSE, for code: the JSX of a .tsx file → the trees the rules run on. One tree for each outermost JSX element. Pure: the source text in, the trees out.
import * as ts from "typescript";
import type { Tree } from "./check";

const nameOf = (n: ts.JsxTagNameExpression): string => (ts.isIdentifier(n) ? n.text : ts.isPropertyAccessExpression(n) ? n.name.text : n.getText());
/** the name a tag starts with: `Checkbox` in <Checkbox>, `CheckboxPrimitive` in <CheckboxPrimitive.Root> */
const rootOf = (n: ts.Expression): string => (ts.isIdentifier(n) ? n.text : ts.isPropertyAccessExpression(n) ? rootOf(n.expression) : "");
/** the category a comment names beside this node: "E1" … "E7", on its own line just above, or on the same line */
const exceptedAt = (sf: ts.SourceFile, node: ts.Node, lines: string[]): string | undefined => {
  const line = sf.getLineAndCharacterOfPosition(node.getStart()).line;
  for (const i of [line, line - 1]) { const m = /\/\*\s*(E\d+)\b[^*]*\*\/|\/\/\s*(E\d+)\b/.exec(lines[i] ?? ""); if (m) return m[1] ?? m[2]; }
  return undefined;
};

export function parseCode(file: string, source: string): Tree[] {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const lines = source.split("\n");
  // what is imported, by the name it has here: from a package, an alias, or a file beside this one. What the file defines itself is in none
  const from: Record<string, string> = {};
  for (const s of sf.statements) if (ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) && s.importClause && !s.importClause.isTypeOnly) {
    const c = s.importClause, b = c.namedBindings;
    if (c.name) from[c.name.text] = s.moduleSpecifier.text;
    if (b && ts.isNamespaceImport(b)) from[b.name.text] = s.moduleSpecifier.text;
    if (b && ts.isNamedImports(b)) for (const e of b.elements) if (!e.isTypeOnly) from[e.name.text] = s.moduleSpecifier.text;
  }
  const element = (node: ts.JsxElement | ts.JsxSelfClosingElement): Tree => {
    const open = ts.isJsxElement(node) ? node.openingElement : node, component = nameOf(open.tagName);
    // an inline style names each property it declares, as `style:name`: a custom property (`--x`) is the one thing it may declare, so it names nothing. A style that is not an object written here is `style`
    const props = open.attributes.properties.flatMap((a) => {
      if (!ts.isJsxAttribute(a)) return ["..."];
      const name = a.name.getText(), init = a.initializer;
      let written: ts.Expression | undefined = init && ts.isJsxExpression(init) ? init.expression : undefined;
      while (written && (ts.isAsExpression(written) || ts.isParenthesizedExpression(written))) written = written.expression;
      if (name !== "style" || !written || !ts.isObjectLiteralExpression(written)) return [name];
      return written.properties.flatMap((p) => {
        const key = ts.isPropertyAssignment(p) ? (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) ? p.name.text : p.name.getText()) : "...";
        return key.startsWith("--") ? [] : [`style:${key}`];
      });
    });
    const values: Record<string, string> = {};
    for (const a of open.attributes.properties) if (ts.isJsxAttribute(a) && a.initializer && ts.isStringLiteral(a.initializer)) values[a.name.getText()] = a.initializer.text;
    let weight = 0; const children: Tree[] = [];
    const take = (c: ts.Node): void => {
      if (ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c)) { children.push(element(c)); return; }
      if (ts.isJsxFragment(c)) { c.children.forEach(take); return; }
      ts.forEachChild(c, take);
    };
    if (ts.isJsxElement(node)) for (const c of node.children) {
      if (ts.isJsxText(c)) { if (c.text.trim()) weight += 1; }
      else if (ts.isJsxExpression(c)) { if (c.expression) { weight += 2; take(c.expression); } }
      else { weight += 1; take(c); }
    }
    // the JSX inside this element's own attributes (an icon passed as a prop) belongs to it too
    for (const a of open.attributes.properties) if (ts.isJsxAttribute(a) && a.initializer) take(a.initializer);
    return { component, raw: /^[a-z]/.test(component), origin: from[rootOf(open.tagName as ts.Expression)], props, values, line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1, children, weight, excepted: exceptedAt(sf, node, lines) };
  };
  const roots: Tree[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) { roots.push(element(n)); return; }
    if (ts.isJsxFragment(n)) { n.children.forEach(visit); return; }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return roots;
}
