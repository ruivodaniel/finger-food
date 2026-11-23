// ============================================================
// THEME BUILD — compile every mobile theme of the library to its native theme
// ============================================================
//
//   npx tsx shared/libs/ui/mobile/theme-engine/build.ts [--themes <dir>] [--only <theme>]
//
// Discovers every <theme>/v<n>/theme.ts whose theme says `platform: "mobile"`
// and writes its output BESIDE it:
//
//   <theme>/v<n>/generated/<theme>.native.json
//
// The web engine (web/theme-engine/build.ts) reads the same folder and takes the
// other themes. A theme is built by one engine, the one of its platform.

import { writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { emitNativeTheme } from './emit';
import type { MobileTheme, Theme } from '../../types';

const ENGINE_DIR = dirname(new URL(import.meta.url).pathname);
const argOf = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const THEMES_DIR = resolve(process.cwd(), argOf('--themes') ?? resolve(ENGINE_DIR, '../../themes'));
const ONLY = argOf('--only');

const dirs = (p: string) => (existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_')).map((d) => d.name) : []);

let built = 0;
for (const dir of dirs(THEMES_DIR)) {
  if (ONLY && dir !== ONLY) continue;
  for (const v of dirs(join(THEMES_DIR, dir)).filter((x) => /^v\d+$/.test(x))) {
    const file = join(THEMES_DIR, dir, v, 'theme.ts');
    if (!existsSync(file)) continue;
    const mod = await import(file);
    const theme = Object.values(mod).find((t): t is Theme =>
      t !== null && typeof t === 'object' && 'id' in t && 'families' in t && (t as { id: string }).id === dir,
    ) ?? Object.values(mod).find((t): t is Theme => t !== null && typeof t === 'object' && 'id' in t && 'families' in t);
    if (!theme || theme.platform !== 'mobile') continue;   // a web theme: the web engine's
    if (theme.id !== dir) console.warn(`  ⚠ ${dir}/${v}: theme.id is "${theme.id}" — the folder name is the id the consumers use`);

    const native = emitNativeTheme(theme as MobileTheme);
    const outDir = join(THEMES_DIR, dir, v, 'generated');
    mkdirSync(outDir, { recursive: true });
    const json = JSON.stringify(native, null, 1) + '\n';
    writeFileSync(join(outDir, `${dir}.native.json`), json, 'utf-8');
    built++;

    const fragments = Object.values(native.elements).reduce((n, e) => n + (e?.fragments.length ?? 0), 0);
    console.log(`  ${dir}/${v}/generated/${dir}.native.json: ${(json.length / 1024).toFixed(1)} KB · ${Object.keys(native.elements).length} elements · ${fragments} fragments · modes ${Object.keys(native.modes).join(', ')}`);
    for (const u of native.unsupported) console.warn(`    ⚠ not emitted — ${u}`);
  }
}
if (!built) console.log('  no mobile theme in ' + THEMES_DIR);
