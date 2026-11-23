// pnpm exec node shared/libs/ui/scripts/shoot-themes.mjs --out <folder> [--themes borro@v2,swiss@v2] [--base http://localhost:8904]
// A picture of each theme at one version, the same screens in each, light mode: what a theme looks like, to compare a change with.
// It uses the UI cockpit at --base (it must be running): the live screens at /ui-snapshot/<id>/<path>?_theme=<theme>@<version>.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const base = arg("base", "http://localhost:8904"), out = resolve(arg("out", "shared/libs/ui/themes/_pictures/before-baseline"));
const SCREENS = {
  "side-navigation-expanded": "/ui-snapshot/ui-snapshot-pattern-component-side-navigation-1-switcher-and-user-menu-default/patterns/component/side-navigation/1-switcher-and-user-menu",
  "side-navigation-compressed": "/ui-snapshot/ui-snapshot-pattern-component-side-navigation-5-compressed-default/patterns/component/side-navigation/5-compressed",
  "dashboard": "/ui-snapshot/ui-snapshot-pattern-page-dashboard-default/patterns/page/dashboard",
  "organization-members": "/ui-snapshot/ui-snapshot-pattern-page-organization-members-default-v3/patterns/page/organization-members-v3",
};
const registry = readFileSync(resolve("_meta/cockpit/v3/src/registry.ts"), "utf-8");
const listed = JSON.parse(/THEMES: Theme\[\] = (\[.*?\]);\n/s.exec(registry)[1]).map((t) => `${t.theme}@${t.version}`);
const themes = (arg("themes") ? arg("themes").split(",") : [...listed.filter((t) => !t.startsWith("wireframe-stroke@")), "wireframe-stroke@v3"]);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const theme of themes) {
  for (const [name, path] of Object.entries(SCREENS)) {
    await page.goto(`${base}${path}?_theme=${encodeURIComponent(theme)}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const file = join(out, `${theme.replace("@", "-")}--${name}.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
}
await browser.close();
