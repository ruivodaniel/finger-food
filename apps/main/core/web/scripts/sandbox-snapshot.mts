#!/usr/bin/env tsx
/**
 * Sandbox snapshot capture — standalone Playwright runner.
 *
 * Treats http://localhost:5173 as a black box (like an e2e test does).
 * Imports nothing from the app. Writes BODY-ONLY HTML fragments to
 * apps/main/web/src/routes/sandbox/_snapshots/snapshots/<id>.html.
 *
 * Usage:
 *   tsx scripts/sandbox-snapshot.mts                       # all pages
 *   tsx scripts/sandbox-snapshot.mts --cast=daniel         # one cast's pages
 *   tsx scripts/sandbox-snapshot.mts --cast=incognito      # anonymous pages
 *   tsx scripts/sandbox-snapshot.mts --id=organization-info # one page
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SNAPSHOT_PAGES, type SnapshotPage } from "../src/routes/sandbox/_snapshots/registry";
import { CAST } from "../src/routes/sandbox/_snapshots/cast";
import { CAST_PASSWORDS } from "../src/routes/sandbox/_snapshots/cast.local";

// ── Paths ────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOTS_DIR = resolve(__dirname, "../src/routes/sandbox/_snapshots/snapshots");
const AUTH_DIR = resolve(__dirname, "../src/routes/sandbox/_snapshots/.auth");

// ── Tunables ─────────────────────────────────────────────────

const BASE = process.env.SANDBOX_SNAPSHOT_BASE ?? "http://localhost:5173";
const NAV_TIMEOUT = 60_000;
const POST_NAV_DELAY = 300;

// ── CLI ──────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));

let pages = SNAPSHOT_PAGES;
if (args.id) pages = pages.filter((p) => p.id === args.id);
if (args.cast === "incognito") pages = pages.filter((p) => !p.cast);
else if (args.cast) pages = pages.filter((p) => p.cast === args.cast);

if (pages.length === 0) {
  console.error("No matching pages.");
  process.exit(1);
}

mkdirSync(SNAPSHOTS_DIR, { recursive: true });
mkdirSync(AUTH_DIR, { recursive: true });

// ── Run ──────────────────────────────────────────────────────

const browser = await chromium.launch({ headless: true });
let okCount = 0;
let errCount = 0;

try {
  // Group by cast — sign in once per cast, then snapshot all that cast's pages.
  const groups = new Map<string | null, SnapshotPage[]>();
  for (const p of pages) {
    const key = p.cast ?? null;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  for (const [castId, groupPages] of groups) {
    console.log(`\n→ ${castId ?? "incognito"} (${groupPages.length} page${groupPages.length === 1 ? "" : "s"})`);
    let context: BrowserContext;
    try {
      context = castId
        ? await acquireAuthedContext(browser, castId)
        : await browser.newContext();
    } catch (err) {
      console.error(`  ✗ context: ${msg(err)}`);
      errCount += groupPages.length;
      continue;
    }
    const page = await context.newPage();
    page.setDefaultTimeout(NAV_TIMEOUT);

    let activeOrg: string | undefined;

    for (const entry of groupPages) {
      const t0 = Date.now();
      try {
        if (entry.activeOrg && entry.activeOrg !== activeOrg && castId) {
          await switchActiveOrg(page, entry.activeOrg);
          activeOrg = entry.activeOrg;
        }

        await page.goto(BASE + entry.url, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(POST_NAV_DELAY);

        for (const a of entry.actions ?? []) {
          if (a.type === "click") await page.getByTestId(a.testId).click({ timeout: 10_000 });
          else if (a.type === "fill") await page.getByTestId(a.testId).fill(a.value, { timeout: 10_000 });
          else if (a.type === "wait") await page.waitForTimeout(a.ms);
        }

        const html = await captureBodyHtml(page);
        const out = resolve(SNAPSHOTS_DIR, `${entry.id}.html`);
        writeFileSync(out, html, "utf8");
        okCount++;
        console.log(`  ✓ ${entry.id}  (${Date.now() - t0}ms, ${(html.length / 1024).toFixed(1)} KB)`);
      } catch (err) {
        errCount++;
        console.error(`  ✗ ${entry.id}  ${msg(err).split("\n")[0]}`);
      }
    }

    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`\n${okCount} ok, ${errCount} failed`);
process.exit(errCount > 0 ? 1 : 0);

// ── Helpers ──────────────────────────────────────────────────

/**
 * Capture body innerHTML with scripts/styles/links stripped — safe to
 * inject inline via dangerouslySetInnerHTML. Done in the page so we don't
 * have to regex-strip on the host.
 */
function captureBodyHtml(page: Page): Promise<string> {
  return page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("script, link, style").forEach((el) => el.remove());
    return clone.innerHTML;
  });
}

async function switchActiveOrg(page: Page, orgName: string) {
  if (!page.url().startsWith(BASE) || page.url().includes("/login")) {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(POST_NAV_DELAY);
  }
  await page.getByTestId("org-switcher-trigger").click({ timeout: 10_000 });
  await page
    .getByTestId("org-switcher-item")
    .filter({ hasText: orgName })
    .first()
    .click({ timeout: 10_000 });
  await page.waitForTimeout(POST_NAV_DELAY);
}

async function acquireAuthedContext(browser: Browser, castId: string): Promise<BrowserContext> {
  const cast = CAST.find((c) => c.id === castId);
  if (!cast) throw new Error(`Unknown cast id "${castId}"`);
  const password = CAST_PASSWORDS[castId];
  if (!password) throw new Error(`No password for "${castId}" in cast.local.ts`);

  const statePath = resolve(AUTH_DIR, `${castId}.json`);

  // Try cached session first — fast path.
  if (existsSync(statePath)) {
    const ctx = await browser.newContext({ storageState: statePath });
    const probe = await ctx.newPage();
    try {
      await probe.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 15_000 });
      await probe.waitForTimeout(500);
      if (!probe.url().includes("/login")) {
        await probe.close();
        return ctx;
      }
    } catch {
      // fall through to fresh sign-in
    }
    await probe.close().catch(() => {});
    await ctx.close().catch(() => {});
  }

  // Fresh sign-in.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(NAV_TIMEOUT);
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });

  const passwordMethodBtn = page.getByTestId("login-method-password-btn");
  if (await passwordMethodBtn.count()) await passwordMethodBtn.click();

  await page.getByTestId("login-identifier-input").fill(cast.email);
  await page.getByTestId("login-password-input").fill(password);
  await page.getByTestId("login-submit-btn").click();

  const result = await Promise.race([
    page
      .waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30_000 })
      .then(() => "ok" as const),
    page
      .getByTestId("login-totp-page")
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => "totp" as const),
  ]).catch(() => "timeout" as const);

  if (result === "totp") {
    throw new Error(`Cast "${castId}" requires TOTP — disable 2FA for snapshot users`);
  }
  if (result === "timeout") {
    throw new Error(`Sign-in for "${castId}" timed out — wrong creds or unexpected redirect`);
  }

  await ctx.storageState({ path: statePath });
  await page.close();
  return ctx;
}

function parseArgs(argv: string[]): { id?: string; cast?: string } {
  const out: { id?: string; cast?: string } = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (!m) continue;
    if (m[1] === "id") out.id = m[2];
    if (m[1] === "cast") out.cast = m[2];
  }
  return out;
}

function msg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
