// ── Slot Rules Processor ──────────────────────────────────────────
// Enforces the 17 rules of UI structure (concept-table v98's two tables,
// container × slot × child) on UI as code (tsx) and UI as data (pattern json).
// Rules live in slot-rules-data.ts as data; this processor walks the UI tree
// and reports every violation.

import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import { glob } from "glob";
import type { LintViolation, Severity, SlotRulesConfig } from "../types.ts";
import {
  CONTAINERS, CONTAINER_ALLOWED_CHILDREN, MUST_LIVE_IN_CONTENT,
  TABSLIST_NOT_IN, OVERLAYS_NOT_IN_CONTAINER, SHELL_ONLY,
  FORBIDDEN_PRIMITIVES, NO_PAD, STACKS, STACK_PLACING_PROPS, SLOT_ALLOWED, FULL_BLEED_IN_CONTAINER,
} from "../slot-rules-data.ts";

interface Ctx { rootDir: string; ignorePatterns: string[] }
const OWNER = "shared/libs/ui";
const PROCESSOR = "slot-rules";

const asGlobs = (p: string | string[]) => (Array.isArray(p) ? p : [p]);
const matches = (f: string, patterns: string[]) => patterns.some((p) => {
  const re = new RegExp("^" + p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "::").replace(/\*/g, "[^/]*").replace(/::/g, ".*") + "$");
  return re.test(f);
});

// ── Core: apply rules given parent and child names ────────────────

type V = { id: string; msg: string };
function checkPair(parent: string, child: string, isPadStack: boolean): V[] {
  const out: V[] = [];
  if (FORBIDDEN_PRIMITIVES.has(child)) {
    const concept = (child === "Alert" || child === "AlertTitle" || child === "AlertDescription") ? "alert" : "empty-state";
    out.push({ id: "slot-forbidden-primitive", msg: `<${child}> is not a primitive; use Card with concept="${concept}".` });
  }
  if ((CONTAINERS as readonly string[]).includes(parent)) {
    if (OVERLAYS_NOT_IN_CONTAINER.has(child)) {
      out.push({ id: "slot-overlay-in-container", msg: `<${child}> is an overlay; trigger it from inside <Content>, not as a child of <${parent}>.` });
    } else if (SHELL_ONLY.has(child)) {
      out.push({ id: "slot-shell-in-container", msg: `<${child}> belongs in a shell zone, never inside <${parent}>.` });
    } else if (MUST_LIVE_IN_CONTENT.has(child)) {
      out.push({ id: "slot-must-be-in-content", msg: `<${child}> must live inside <Content>, not straight in <${parent}>.` });
    } else if (!CONTAINER_ALLOWED_CHILDREN.has(child) && !/^[A-Z][a-zA-Z]*(Header|Footer|Title)$/.test(child)) {
      out.push({ id: "slot-not-allowed-in-container", msg: `<${child}> is not a valid direct child of <${parent}>. Wrap it in <Content>.` });
    }
  }
  if (child === "TabsList" && TABSLIST_NOT_IN.has(parent)) {
    out.push({ id: "slot-tabslist-in-header", msg: `<TabsList> must be a part of the container, not inside <${parent}>.` });
  }
  if (parent === "Content" && FULL_BLEED_IN_CONTAINER.has(child)) {
    out.push({ id: "slot-fullbleed-in-content", msg: `<${child}> is full-bleed by default; place it straight in the container, not inside <Content>.` });
  }
  const allowed = SLOT_ALLOWED[parent];
  if (allowed !== undefined && allowed !== "*" && !allowed.has(child) && !child.startsWith("__")) {
    out.push({ id: "slot-forbidden-child", msg: `<${child}> is not allowed inside <${parent}>.` });
  }
  if (NO_PAD.has(child) && isPadStack) {
    out.push({ id: "slot-stack-no-pad", msg: `<${child}> must not write pad=; the carrying slot owns the padding.` });
  }
  return out;
}

// ── TSX walker ────────────────────────────────────────────────────

function nameOf(n: ts.JsxTagNameExpression): string {
  if (ts.isIdentifier(n)) return n.text;
  if (ts.isPropertyAccessExpression(n)) return n.name.text;
  return "";
}
function hasPad(el: ts.JsxOpeningLikeElement): boolean {
  for (const a of el.attributes.properties) {
    if (ts.isJsxAttribute(a) && a.name && ts.isIdentifier(a.name) && a.name.text === "pad") return true;
  }
  return false;
}
function kids(n: ts.JsxElement | ts.JsxFragment): Array<{ name: string; node: ts.Node; pad: boolean }> {
  const r: Array<{ name: string; node: ts.Node; pad: boolean }> = [];
  for (const c of n.children) {
    if (ts.isJsxElement(c)) r.push({ name: nameOf(c.openingElement.tagName), node: c, pad: hasPad(c.openingElement) });
    else if (ts.isJsxSelfClosingElement(c)) r.push({ name: nameOf(c.tagName), node: c, pad: hasPad(c) });
    else if (ts.isJsxFragment(c)) r.push(...kids(c));
  }
  return r;
}
/** what a Stack holds: elements and non-blank text count one each; an expression ({items.map(...)}, {cond && ...}) can yield many, so it counts as several */
function stackWeight(n: ts.JsxElement): number {
  let w = 0;
  for (const c of n.children) {
    if (ts.isJsxText(c)) { if (c.text.trim()) w += 1; }
    else if (ts.isJsxExpression(c)) { if (c.expression) w += 2; }
    else w += 1;
  }
  return w;
}
function walkTsx(file: string, src: string, severity: Severity): LintViolation[] {
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const out: LintViolation[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node)) {
      const parent = nameOf(node.openingElement.tagName);
      if (STACKS.has(parent) && stackWeight(node) === 1 && !node.openingElement.attributes.properties.some((a) => !ts.isJsxAttribute(a) || STACK_PLACING_PROPS.has(a.name.getText()))) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
        out.push({ id: "slot-stack-single-child", processor: PROCESSOR, owner: OWNER, severity, file, lines: [line + 1], message: `<${parent}> holds a single child and places nothing: remove the ${parent} (or give it justify / align / size / className).` });
      }
      for (const k of kids(node)) {
        for (const v of checkPair(parent, k.name, k.pad)) {
          const { line } = sf.getLineAndCharacterOfPosition(k.node.getStart());
          out.push({
            id: v.id, processor: PROCESSOR, owner: OWNER, severity,
            file, lines: [line + 1], message: v.msg,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return out;
}

// ── JSON walker ───────────────────────────────────────────────────

type JsonNode = { type?: string; props?: Record<string, unknown>; children?: unknown };
function walkJson(file: string, j: unknown, severity: Severity): LintViolation[] {
  const out: LintViolation[] = [];
  function visit(n: unknown, parent?: string) {
    if (Array.isArray(n)) { for (const v of n) visit(v, parent); return; }
    if (!n || typeof n !== "object") return;
    const o = n as JsonNode;
    const self = o.type;
    if (self && parent) {
      const padStack = Boolean(o.props && typeof o.props === "object" && "pad" in o.props);
      for (const v of checkPair(parent, self, padStack)) {
        out.push({ id: v.id, processor: PROCESSOR, owner: OWNER, severity, file, lines: [1], message: v.msg });
      }
    }
    if (self && STACKS.has(self)) {
      const c = o.children;
      if ((typeof c === "string" || (Array.isArray(c) && c.length === 1)) && !Object.keys(o.props ?? {}).some((k) => STACK_PLACING_PROPS.has(k))) {
        out.push({ id: "slot-stack-single-child", processor: PROCESSOR, owner: OWNER, severity, file, lines: [1], message: `<${self}> holds a single child and places nothing: remove the ${self} (or give it justify / align / size / className).` });
      }
    }
    const nextParent = self ?? parent;
    for (const [k, v] of Object.entries(o)) {
      if (k === "type" || k === "props") continue;
      visit(v, nextParent);
    }
  }
  visit(j);
  return out;
}

// ── Entrypoint ────────────────────────────────────────────────────

export async function processSlotRulesControls(
  config: SlotRulesConfig | undefined,
  ctx: Ctx,
): Promise<LintViolation[]> {
  if (!config) return [];
  const severity: Severity = config.severity ?? "warn";
  const patterns = asGlobs(config.in);
  const exceptions = (config.exceptions ?? []).map((e) => e.in);

  const tsxFiles = (await Promise.all(patterns.map((p) =>
    glob(p.endsWith(".tsx") ? p : `${p}/**/*.tsx`, { cwd: ctx.rootDir, ignore: ctx.ignorePatterns }),
  ))).flat();
  const jsonFiles = (await Promise.all(patterns.map((p) =>
    glob(p.endsWith(".json") ? p : `${p}/**/index.json`, { cwd: ctx.rootDir, ignore: ctx.ignorePatterns }),
  ))).flat();

  const out: LintViolation[] = [];
  for (const f of tsxFiles) {
    if (matches(f, exceptions)) continue;
    const full = path.join(ctx.rootDir, f);
    try { out.push(...walkTsx(f, fs.readFileSync(full, "utf8"), severity)); } catch {}
  }
  for (const f of jsonFiles) {
    if (matches(f, exceptions)) continue;
    const full = path.join(ctx.rootDir, f);
    try { out.push(...walkJson(f, JSON.parse(fs.readFileSync(full, "utf8")), severity)); } catch {}
  }
  return out;
}
