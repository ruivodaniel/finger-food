// Regenerates the "## Element Values" section of docs/consumer/developer/markup-dictionary.md
// from types/elements.ts, the one table the theme types, the engine and the components derive from.
//
//   npx tsx shared/libs/ui/scripts/markup-dictionary-elements.ts
//
// Identities come from the engine's own selector builder, so the doc cannot drift from what the
// engine matches. The "### Typography" block at the end of the section is kept as written.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ELEMENTS, type Family } from '../types/elements';
import { EMPHASIS, STATUS, STATE, SCALE } from '../types/axes';
import { elementSelector } from '../web/theme-engine/conventions';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOC = resolve(HERE, '../docs/consumer/developer/markup-dictionary.md');

const FAMILIES: { family: Family; title: string }[] = [
  { family: 'surface', title: 'Surface' },
  { family: 'overlay', title: 'Overlay' },
  { family: 'control', title: 'Control' },
  { family: 'control-group', title: 'Control group' },
  { family: 'field', title: 'Field' },
  { family: 'list', title: 'List' },
  { family: 'table', title: 'Table' },
  { family: 'shape', title: 'Shape' },
  { family: 'media', title: 'Media' },
];

function cell(values: readonly string[], full: readonly string[]): string {
  if (values.length === 0) return '–';
  if (values.length === full.length && full.every((v) => values.includes(v))) return 'all';
  return values.join(' ');
}

function identity(key: string): string {
  const sel = elementSelector(key); // [element="surface--card"]
  const m = /\[element="([^"]+)"\]/.exec(sel);
  if (!m) throw new Error(`no identity for ${key}`);
  return m[1];
}

function section(): string {
  const out: string[] = [];
  out.push('## Element Values');
  out.push('');
  out.push('Format: `element="{family}--{element}"`. Generated from `shared/libs/ui/types/elements.ts` by');
  out.push('`shared/libs/ui/scripts/markup-dictionary-elements.ts`; do not edit by hand. Each row lists the axes the');
  out.push('element carries: `all` is the full set from `types/axes.ts`, `–` means the axis does not apply, anything');
  out.push('else is the subset. `concept` is always allowed. Typography identities (`type--…`) are a separate vocabulary.');
  out.push('');
  for (const { family, title } of FAMILIES) {
    const rows = Object.entries(ELEMENTS).filter(([, row]) => row.family === family);
    if (rows.length === 0) continue;
    out.push(`### ${title} (\`${family}--…\`)`);
    out.push('');
    out.push('| Value | Emphasis | Status | State | Scale | Why |');
    out.push('|---|---|---|---|---|---|');
    for (const [key, row] of rows) {
      out.push(
        `| \`${identity(key)}\` | ${cell(row.emphasis, EMPHASIS)} | ${cell(row.status, STATUS)} | ${cell(row.state, STATE)} | ${cell(row.scale, SCALE)} | ${row.why} |`,
      );
    }
    out.push('');
  }
  return out.join('\n');
}

const doc = readFileSync(DOC, 'utf8');
const start = doc.indexOf('## Element Values');
const typo = doc.indexOf('### Typography', start);
const end = doc.indexOf('## Layout Values', start);
if (start < 0 || typo < 0 || end < 0) throw new Error('markers not found in markup-dictionary.md');
const typography = doc.slice(typo, end); // kept verbatim, ends with the --- separator
writeFileSync(DOC, doc.slice(0, start) + section() + '\n' + typography + doc.slice(end));
console.log(`markup-dictionary.md: Element Values regenerated (${Object.keys(ELEMENTS).length} rows)`);
