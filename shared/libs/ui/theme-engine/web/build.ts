#!/usr/bin/env tsx
// ============================================================
// BUILD — Compile theme objects into static CSS
// ============================================================
//
// Usage:
//   npx tsx shared/libs/ui/web/theme-engine/build.ts [--themes <dir>]
//
// A theme collection is a folder of <theme>/v<n>/theme.ts. Every theme@version
// compiles to its own <theme>/v<n>/generated/<theme>.css (+ <theme>-fonts.css),
// beside its source — the versioned CSS the consumers point at (the app through
// configs/theme, a slice-design project through its active.json). Defaults to
// shared/libs/ui/themes/; a caller may point --themes at another collection.
// One theme@version → one CSS file. All modes included, scoped by selector.
// No runtime JS. No duplication.
//

import { writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { themeToCSS, themeToFontsCSS } from './v1/theme-process';
import { resolveAuthored, type AuthoredTheme, type Baseline, type Palette } from './v2';
import { themeToCSS as themeV2ToCSS } from './v3';
import { WebTheme as WebThemeSchemaV2 } from '../../types/schema/v2/theme';
import { WebTheme as WebThemeSchema } from '../../types/schema/theme';
import type { Theme } from '../../types';
import { THEME_ADDONS, THEME_SLICE_ADDONS } from '../../../../configs/theme';
import { KNOWLEDGE_LEAVES, KNOWLEDGE_EFFECTS, type KnowledgeLeaf } from '../../../knowledge/theme';

/** the leaves the config turns on */
const leavesOn = (): KnowledgeLeaf[] => { const k: { wholeFamily: boolean; familyLeafs?: Partial<Record<KnowledgeLeaf, boolean>> } = THEME_ADDONS.knowledge; return (Object.keys(KNOWLEDGE_LEAVES) as KnowledgeLeaf[]).filter((leaf) => k.wholeFamily || k.familyLeafs?.[leaf]); };
/** the concepts and the effects of the add-ons the config turns on, added to a theme's own */
const addonConcepts = (): NonNullable<Theme['concepts']> => Object.assign({}, ...leavesOn().map((leaf) => KNOWLEDGE_LEAVES[leaf]));
const addonEffects = (): Theme['effects'] => Object.assign({}, ...leavesOn().map((leaf) => KNOWLEDGE_EFFECTS[leaf] ?? {}));

const ENGINE_DIR = dirname(new URL(import.meta.url).pathname);

// the slices' own concepts and effects: the config names each slice's theme file, the engine only loads what it is named
const REPO_ROOT = resolve(ENGINE_DIR, '../../../../..');
const sliceConcepts: NonNullable<Theme['concepts']> = {};
const sliceEffects: NonNullable<Theme['effects']> = {};
for (const path of THEME_SLICE_ADDONS) {
  const mod = await import(resolve(REPO_ROOT, path)) as { SLICE_CONCEPTS?: NonNullable<Theme['concepts']>; SLICE_EFFECTS?: NonNullable<Theme['effects']> };
  Object.assign(sliceConcepts, mod.SLICE_CONCEPTS ?? {});
  Object.assign(sliceEffects, mod.SLICE_EFFECTS ?? {});
}
const argOf = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const THEMES_DIR = resolve(process.cwd(), argOf('--themes') ?? resolve(ENGINE_DIR, '../../themes'));
const ONLY = argOf('--only');   // regenerate a single theme (all its versions)

// Discover every <theme>/v<n>/theme.ts
const dirs = (p: string) => (existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_')).map((d) => d.name) : []);
const versions: { theme: string; v: string; file: string }[] = [];
for (const theme of dirs(THEMES_DIR)) {
  if (ONLY && theme !== ONLY) continue;
  for (const v of dirs(join(THEMES_DIR, theme)).filter((x) => /^v\d+$/.test(x))) {
    const file = join(THEMES_DIR, theme, v, 'theme.ts');
    if (existsSync(file)) versions.push({ theme, v, file });
  }
}

if (!versions.length) console.warn(`  ⚠ no <theme>/v<n>/theme.ts under ${THEMES_DIR}`);

for (const { theme: dir, v, file } of versions) {
  const mod = await import(file);
  let theme = Object.values(mod).find((t): t is Theme =>
    t !== null && typeof t === 'object' && 'id' in t && ('families' in t || 'extends' in t)
  );
  if (!theme) { console.warn(`  ⚠ ${dir}/${v}: no Theme export found, skipping`); continue; }
  // engine version 2: the theme names a baseline and a palette; the resolver makes one whole theme of them and the theme's own keys, which the one schema validates
  if ((theme as { engine?: number }).engine === 2) {
    const authored = theme as unknown as AuthoredTheme;
    const layer = async <T,>(folder: string, [name, n]: [string, number], key: string): Promise<T> => (await import(join(THEMES_DIR, folder, name, `v${n}`, `${key}.ts`)) as Record<string, T>)[key];
    const resolved = resolveAuthored(authored, await layer<Baseline>('_baselines', authored.extends, 'baseline'), await layer<Palette>('_palettes', authored.palette, 'palette'));
    const checked = WebThemeSchema.safeParse(resolved.theme);
    // the issues are said, not stopped on: the schema is behind the engine for a few keys the themes of today use (contextual.menu.separator, contextual.sidebar.sidebarItem); the check says them too
    if (!checked.success) console.warn(`  ⚠ ${dir}/${v}: the resolved theme has ${checked.error.issues.length} schema issue(s)\n${checked.error.issues.slice(0, 6).map((i) => `    ${i.path.join('.')}: ${i.message}`).join('\n')}`);
    theme = resolved.theme as unknown as Theme;
    mkdirSync(join(THEMES_DIR, dir, v, 'generated'), { recursive: true });
    writeFileSync(join(THEMES_DIR, dir, v, 'generated', `${dir}.from.json`), JSON.stringify(resolved.from, null, 1), 'utf-8');
  }
  // this engine emits CSS: a mobile theme is not its to build
  if (theme.platform === 'mobile') { console.log(`  ${dir}/${v}: a mobile theme — no CSS`); continue; }
  if (theme.id !== dir) console.warn(`  ⚠ ${dir}/${v}: theme.id is "${theme.id}" — the folder name is the id the consumers use`);

  const outDir = join(THEMES_DIR, dir, v, 'generated');
  mkdirSync(outDir, { recursive: true });
  const withAddons = (t: Theme): Theme => ({ ...t, concepts: { ...t.concepts, ...addonConcepts(), ...sliceConcepts }, effects: { ...t.effects, ...addonEffects(), ...sliceEffects } }) as Theme;
  // a theme written in the theme language v2 (dsl: 2) is compiled by engine v3: the language and its engine move together
  let css: string;
  if ((theme as { dsl?: number }).dsl === 2) {
    const checked = WebThemeSchemaV2.safeParse(theme);
    if (!checked.success) console.warn(`  ⚠ ${dir}/${v}: ${checked.error.issues.length} schema issue(s) in the theme language v2\n${checked.error.issues.slice(0, 8).map((i) => `    ${i.path.join('.')}: ${i.message}`).join('\n')}`);
    css = themeV2ToCSS(withAddons(theme));
  } else css = themeToCSS(withAddons(theme));
  const fontsCSS = themeToFontsCSS(theme);
  writeFileSync(join(outDir, `${dir}.css`), css, 'utf-8');
  writeFileSync(join(outDir, `${dir}-fonts.css`), fontsCSS, 'utf-8');
  // the theme's definitions before the layouts and elements (L1, L1b, L2), as data: what the design cockpit's theme tokens view reads
  const { colors, modes, typography, spacing, radius, borderWidths, effects, transitions, icons, gradients, families } = theme;
  writeFileSync(join(outDir, `${dir}.theme.json`), JSON.stringify({ id: theme.id, name: theme.name, version: theme.version, type: theme.type, colors, modes, typography, spacing, radius, borderWidths, effects, transitions, icons, gradients, families }, null, 1), 'utf-8');

  console.log(`  ${dir}/${v}/generated/${dir}.css: ${(css.length / 1024).toFixed(1)} KB, ${css.split('\n').length} lines · fonts ${(fontsCSS.length / 1024).toFixed(1)} KB`);
}
