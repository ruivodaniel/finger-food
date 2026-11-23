#!/usr/bin/env node
// build-fixtures.mjs
// Walks src/routes/sandbox/theme-editor/_fixtures/html/**.html recursively
// and regenerates src/routes/sandbox/theme-editor/_fixtures/generated.ts
//
// Usage: pnpm theme:fixtures
//
// Each HTML file may have a label comment on line 1:
//   <!-- label: My Page Title -->
// Without it, the filename (titlecased) becomes the label.
//
// Folder structure mirrors the navigator menu hierarchy. e.g.:
//   _fixtures/html/elements/foundation/typography.html
//     → { id: 'elements/foundation/typography', path: ['elements','foundation','typography'], label: 'Typography' }

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HTML_DIR  = join(__dirname, '../src/routes/sandbox/theme-editor/_fixtures/html');
const OUT_FILE  = join(__dirname, '../src/routes/sandbox/theme-editor/_fixtures/generated.ts');

const LABEL_RE = /^<!--\s*label:\s*(.+?)\s*-->/;

function titleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function extractLabel(content, fallback) {
  const firstLine = content.split('\n')[0].trim();
  const match = firstLine.match(LABEL_RE);
  if (match) return match[1];
  return titleCase(fallback);
}

function escapeTemplateLiteral(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (entry.endsWith('.html')) files.push(full);
  }
  return files;
}

const filesAbs = walk(HTML_DIR);

if (filesAbs.length === 0) {
  console.log('No HTML files found in', HTML_DIR);
  console.log('Add .html files there and re-run.');
}

const fixtures = filesAbs.map(abs => {
  const rel = relative(HTML_DIR, abs);          // "elements/foundation/typography.html"
  const segs = rel.split(sep);
  const fileName = segs.pop();                   // "typography.html"
  const baseName = basename(fileName, '.html');  // "typography"
  const path = [...segs, baseName];              // ["elements","foundation","typography"]
  const id = path.join('/');                     // "elements/foundation/typography"

  const content = readFileSync(abs, 'utf8');
  const label = extractLabel(content, baseName);
  const html = escapeTemplateLiteral(content.trim());
  console.log(`  ✓ ${rel} → "${label}" (id: ${id})`);
  return { id, path, label, html };
});

const blocks = fixtures.map(({ id, path, label, html }) => {
  const pathLit = JSON.stringify(path);
  return `  {\n    id: '${id}',\n    path: ${pathLit},\n    label: '${label}',\n    html: \`${html}\`,\n  }`;
}).join(',\n');

const output = `// AUTO-GENERATED — do not edit by hand
// Run \`pnpm theme:fixtures\` to rebuild from _fixtures/html/**.html

import type { Fixture } from './types';

export const FIXTURES: Fixture[] = [
${blocks}
];
`;

writeFileSync(OUT_FILE, output, 'utf8');
console.log(`\nWrote ${fixtures.length} fixture(s) → ${OUT_FILE}`);
