#!/usr/bin/env tsx
/**
 * Generates an ASCII type tree from the Theme DSL types.
 *
 * Run:    npx tsx shared/libs/ui/scripts/dsl-tree.ts
 * Output: _meta/product/theming/dsl-tree.md
 */

import ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

// ── Config ───────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const ENTRY = path.join(ROOT, 'shared/libs/ui/types/theme.ts');
const OUT = path.join(ROOT, '_meta/product/theming/dsl-tree.md');
const MAX_DEPTH = 7;

// Global memo: named types that have already been fully expanded once.
// On second encounter (outside ancestor chain), show "→ TypeName" instead.
const globalExpanded = new Set<string>();

// Types that are terminal — show name, never recurse into.
const LEAF_TYPE_NAMES = new Set([
  'string', 'number', 'boolean', 'undefined', 'null', 'unknown', 'any',
  'ColorRef', 'EffectToken', 'RadiusToken', 'SpacingToken', 'BlurToken',
  'SizeToken', 'CursorToken', 'FontWeight', 'FontStyle', 'FontFamilyToken',
  'TypographyTypeKey', 'TypographyTypeKeyE', 'BorderStyleToken',
  'TransitionDuration', 'TransitionTiming', 'AnimationTokens', 'TextEffectLayer',
  'ScrollbarTokens', 'SeparatorTokens',
]);

// ── Compiler setup ────────────────────────────────────────────────────────────

const program = ts.createProgram([ENTRY], {
  target: ts.ScriptTarget.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  strict: false,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();

// ── Helpers ───────────────────────────────────────────────────────────────────

function typeId(type: ts.Type): number {
  return (type as ts.Type & { id?: number }).id ?? 0;
}

function typeName(type: ts.Type): string {
  if (type.aliasSymbol) return type.aliasSymbol.getName();
  if (type.symbol && type.symbol.getName() !== '__type') return type.symbol.getName();
  return checker.typeToString(type);
}

function stripUndefined(type: ts.Type): ts.Type {
  if (type.isUnion()) {
    const rest = type.types.filter(t => !(t.flags & ts.TypeFlags.Undefined));
    if (rest.length === 1) return rest[0];
  }
  return type;
}

function isLeaf(type: ts.Type): boolean {
  if (LEAF_TYPE_NAMES.has(typeName(type))) return true;
  const f = type.flags;
  return !!(f & (
    ts.TypeFlags.String | ts.TypeFlags.Number | ts.TypeFlags.Boolean |
    ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral | ts.TypeFlags.BooleanLiteral |
    ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Never | ts.TypeFlags.Void
  ));
}

function renderUnion(type: ts.Type): string {
  if (!type.isUnion()) return checker.typeToString(type);
  return type.types
    .filter(t => !(t.flags & ts.TypeFlags.Undefined))
    .map(t => checker.typeToString(t))
    .join(' | ');
}

function isAllLiteralUnion(type: ts.Type): boolean {
  if (!type.isUnion()) return false;
  return type.types.every(t =>
    !!(t.flags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral |
      ts.TypeFlags.BooleanLiteral | ts.TypeFlags.Undefined | ts.TypeFlags.Null))
  );
}

// ── Tree node ─────────────────────────────────────────────────────────────────

interface Node { label: string; children: Node[] }

function expandType(type: ts.Type, ancestorIds: Set<number>, depth: number): Node[] {
  if (depth >= MAX_DEPTH) return [];

  type = stripUndefined(type);
  const id = typeId(type);
  const name = typeName(type);

  // Cycle by type identity
  if (id !== 0 && ancestorIds.has(id)) {
    return [{ label: `...${name}...`, children: [] }];
  }

  if (isLeaf(type)) return [];

  // All-literal union → inline
  if (isAllLiteralUnion(type)) {
    return [{ label: renderUnion(type), children: [] }];
  }

  // Any union → inline type string
  if (type.isUnion()) {
    return [{ label: checker.typeToString(type).slice(0, 80), children: [] }];
  }

  // Record / Partial<Record> → inline
  const typeStr = checker.typeToString(type);
  if (typeStr.startsWith('Record<') || typeStr.startsWith('Partial<')) {
    return [{ label: typeStr.slice(0, 80), children: [] }];
  }

  // Array → inline element type
  if (checker.isArrayType(type)) {
    const elem = (type as ts.TypeReference).typeArguments?.[0];
    return [{ label: `${elem ? typeName(elem) : '?'}[]`, children: [] }];
  }

  const props = type.getProperties();
  if (props.length === 0) return [];

  // Global memo: already expanded this named type elsewhere — don't repeat
  const isNamed = name !== '__type' && !name.startsWith('{');
  if (isNamed && globalExpanded.has(name)) {
    return [{ label: `→ ${name}`, children: [] }];
  }
  if (isNamed) globalExpanded.add(name);

  const nextIds = new Set(ancestorIds);
  if (id !== 0) nextIds.add(id);

  return props.map(prop => {
    const opt = prop.flags & ts.SymbolFlags.Optional ? '?' : '';
    const raw = checker.getTypeOfSymbol(prop);
    const pt = stripUndefined(raw);
    const pid = typeId(pt);
    const pname = typeName(pt);

    // Leaf
    if (isLeaf(pt)) return { label: `${prop.getName()}${opt}  ${pname}`, children: [] };

    // Literal union — inline
    if (isAllLiteralUnion(pt)) {
      return { label: `${prop.getName()}${opt}  ${renderUnion(pt)}`, children: [] };
    }

    // Cycle by identity
    if (pid !== 0 && nextIds.has(pid)) {
      return { label: `${prop.getName()}${opt}  ...${pname}...`, children: [] };
    }

    // Inline containers
    const pts = checker.typeToString(pt);
    if (pts.startsWith('Record<') || pts.startsWith('Partial<')) {
      return { label: `${prop.getName()}${opt}  ${pts.slice(0, 80)}`, children: [] };
    }
    if (checker.isArrayType(pt)) {
      const elem = (pt as ts.TypeReference).typeArguments?.[0];
      return { label: `${prop.getName()}${opt}  ${elem ? typeName(elem) : '?'}[]`, children: [] };
    }

    const children = expandType(pt, nextIds, depth + 1);
    return {
      label: children.length > 0 ? `${prop.getName()}${opt}  (${pname})` : `${prop.getName()}${opt}  ${pname}`,
      children,
    };
  });
}

// ── Iterative ASCII renderer ──────────────────────────────────────────────────

function render(roots: Node[]): string[] {
  const lines: string[] = [];
  // Stack entries: [node, prefix, isLast]
  const stack: Array<[Node, string, boolean]> = [];
  for (let i = roots.length - 1; i >= 0; i--) {
    stack.push([roots[i], '', i === roots.length - 1]);
  }
  while (stack.length > 0) {
    const [node, prefix, last] = stack.pop()!;
    lines.push(prefix + (last ? '└── ' : '├── ') + node.label);
    const childPrefix = prefix + (last ? '    ' : '│   ');
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push([node.children[i], childPrefix, i === node.children.length - 1]);
    }
  }
  return lines;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const sourceFile = program.getSourceFile(ENTRY);
if (!sourceFile) { console.error(`Could not load ${ENTRY}`); process.exit(1); }

let themeType: ts.Type | undefined;
ts.forEachChild(sourceFile, node => {
  if (ts.isTypeAliasDeclaration(node) && node.name.text === 'Theme') {
    themeType = checker.getTypeAtLocation(node.type);
  }
});
if (!themeType) { console.error('Theme type not found'); process.exit(1); }

const roots = expandType(themeType, new Set(), 0);
const treeLines = ['Theme', ...render(roots)];

const md = [
  '# DSL Type Tree',
  '',
  '> Auto-generated. Re-run `npx tsx shared/libs/ui/scripts/dsl-tree.ts` after type changes.',
  '',
  '```',
  ...treeLines,
  '```',
  '',
].join('\n');

fs.writeFileSync(OUT, md);
console.log(`Written: ${OUT}  (${treeLines.length} lines)`);
