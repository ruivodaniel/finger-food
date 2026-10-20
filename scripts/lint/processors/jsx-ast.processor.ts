// ── JSX AST Processor ─────────────────────────────────────────────
// Uses TypeScript's compiler API to parse TSX and walk the JSX tree.
// Catches violations that require parent-child awareness:
//
//   1. no-anchor-button-nesting
//      <a>/<Link> cannot contain <button> or button-rendering components.
//      The asChild Slot pattern must be used instead.
//
//   2. no-shell-bare-div
//      A <div> whose direct children include SidebarProvider, SidebarInset,
//      or <main> is a shell — it must use Shell/Page from @libs/web-layouts.

import * as ts from "typescript";
import type { LintViolation, Severity } from "../types.ts";
import { getSourceFiles, readFile, pathMatchesPattern } from "../utils/files.ts";

// ── Config ──────────────────────────────────────────────────────────

export interface JsxAstRule {
  id: string;
  severity: Severity;
  description: string;
  message: string;
  enabled?: boolean;
}

export interface JsxAstConfig {
  in: string | string[];
  exceptions?: Array<{ in: string; reason: string }>;
  rules: JsxAstRule[];
}

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Get the tag name string from a JSX opening/self-closing element. */
function getTagName(node: ts.JsxOpeningLikeElement): string {
  const tag = node.tagName;
  if (ts.isIdentifier(tag)) return tag.text;
  if (ts.isPropertyAccessExpression(tag)) {
    // e.g. Icons.Plus → "Icons.Plus"
    return tag.getText();
  }
  return "";
}

/** Check if a JSX element has the `asChild` prop. */
function hasAsChildProp(node: ts.JsxOpeningLikeElement): boolean {
  return node.attributes.properties.some(
    (attr) => ts.isJsxAttribute(attr) && attr.name.getText() === "asChild"
  );
}

/** Get line number (1-based) for a node. */
function getLine(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
}

// ── Tags that render as interactive elements ────────────────────────

// Tags that are anchors or render as anchors
const ANCHOR_TAGS = new Set(["a", "Link"]);

// Tags that render as <button> or contain a <button> by default
const BUTTON_TAGS = new Set([
  "button",
  "Button",
  "SidebarMenuButton",
  "DropdownMenuTrigger",
  "DialogTrigger",
  "PopoverTrigger",
  "AlertDialogTrigger",
  "SheetTrigger",
  "CollapsibleTrigger",
  "NavigationMenuTrigger",
  "TabsTrigger",
  "AccordionTrigger",
  "ToggleGroupItem",
  "Toggle",
]);

// Tags that indicate shell structure when children of a <div>
const SHELL_CHILDREN = new Set([
  "SidebarProvider",
  "SidebarInset",
  "main",
]);

// ── Rule: no-anchor-button-nesting ──────────────────────────────────

function checkAnchorButtonNesting(
  sourceFile: ts.SourceFile,
  violations: LintViolation[],
  rule: JsxAstRule,
  owner: string,
  file: string,
): void {
  function visit(node: ts.Node): void {
    // Find <a> or <Link> elements
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tagName = getTagName(opening);

      if (ANCHOR_TAGS.has(tagName)) {
        // Walk descendants looking for button-like elements
        findButtonDescendants(node, sourceFile, violations, rule, owner, file, tagName, getLine(sourceFile, node));
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function findButtonDescendants(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  violations: LintViolation[],
  rule: JsxAstRule,
  owner: string,
  file: string,
  anchorTag: string,
  anchorLine: number,
): void {
  function walkChildren(child: ts.Node): void {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      const opening = ts.isJsxElement(child) ? child.openingElement : child;
      const childTag = getTagName(opening);

      if (BUTTON_TAGS.has(childTag)) {
        // Check if it has asChild — if so, it's using Slot correctly
        if (!hasAsChildProp(opening)) {
          violations.push({
            id: rule.id,
            owner,
            processor: "jsx-ast",
            severity: rule.severity,
            file,
            lines: [getLine(sourceFile, child)],
            message: `<${childTag}> inside <${anchorTag}> (line ${anchorLine}) creates invalid HTML (<button> inside <a>). Use asChild on <${childTag}> so the anchor becomes the root element.`,
          });
        }
      }
    }

    ts.forEachChild(child, walkChildren);
  }

  // Don't check the anchor itself, only its children
  if (ts.isJsxElement(node)) {
    ts.forEachChild(node, walkChildren);
  }
}

// ── Rule: no-shell-bare-div ─────────────────────────────────────────

function checkShellBareDiv(
  sourceFile: ts.SourceFile,
  violations: LintViolation[],
  rule: JsxAstRule,
  owner: string,
  file: string,
): void {
  function visit(node: ts.Node): void {
    if (ts.isJsxElement(node)) {
      const opening = node.openingElement;
      const tagName = getTagName(opening);

      if (tagName === "div") {
        // Check if any direct children are shell-indicating components
        const shellChildren: string[] = [];

        for (const child of node.children) {
          if (ts.isJsxElement(child)) {
            const childTag = getTagName(child.openingElement);
            if (SHELL_CHILDREN.has(childTag)) {
              shellChildren.push(childTag);
            }
          } else if (ts.isJsxSelfClosingElement(child)) {
            const childTag = getTagName(child);
            if (SHELL_CHILDREN.has(childTag)) {
              shellChildren.push(childTag);
            }
          }
        }

        if (shellChildren.length > 0) {
          violations.push({
            id: rule.id,
            owner,
            processor: "jsx-ast",
            severity: rule.severity,
            file,
            lines: [getLine(sourceFile, node)],
            message: `Bare <div> wrapping ${shellChildren.join(", ")} is a shell structure. Use Shell/Page from @libs/web-layouts instead.`,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

// ── Processor entry point ───────────────────────────────────────────

export async function processJsxAstControls(
  config: JsxAstConfig,
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  const enabledRules = config.rules.filter((r) => r.enabled !== false);
  if (enabledRules.length === 0) return violations;

  const ruleMap = new Map(enabledRules.map((r) => [r.id, r]));

  const files = await getSourceFiles(ctx.rootDir, ctx.allSourceGlobs, ctx.ignorePatterns);
  const tsxFiles = files.filter((f) => f.endsWith(".tsx"));

  for (const file of tsxFiles) {
    // Scope check
    if (!pathMatchesPattern(file, config.in)) continue;
    // Exception check
    if (config.exceptions?.some((ex) => pathMatchesPattern(file, ex.in))) continue;

    const content = readFile(ctx.rootDir, file);
    if (!content) continue;

    // Parse with TypeScript
    const sourceFile = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true, // setParentNodes
      ts.ScriptKind.TSX,
    );

    // Run each enabled rule
    const anchorRule = ruleMap.get("no-anchor-button-nesting");
    if (anchorRule) {
      checkAnchorButtonNesting(sourceFile, violations, anchorRule, "global", file);
    }

    const shellRule = ruleMap.get("no-shell-bare-div");
    if (shellRule) {
      checkShellBareDiv(sourceFile, violations, shellRule, "global", file);
    }
  }

  return violations;
}
