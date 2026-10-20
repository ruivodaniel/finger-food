#!/usr/bin/env node
// ── Cast Boundary Processor Tests ─────────────────────────────────
// Run: pnpm tsx scripts/lint/__test__/cast-boundary.test.ts
//
// Covers:
//   1. Cast in allowed file with correct comment         → PASS
//   2. Cast in allowed file with missing comment         → WARN
//   3. Cast in allowed file with wrong boundary comment  → WARN
//   4. Cast in non-allowlisted file (comment irrelevant) → ERROR
//   5. `as const` anywhere                               → PASS
//   6. Import/export alias `as`                          → PASS
//   7. Boundary comment on preceding line                → PASS
//   8. File on multiple boundaries, any match counts     → PASS
//   9. Deliberate-failure: legit comment can't save non-allowlisted file

import assert from "node:assert/strict";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { processCastBoundaryControls } from "../processors/cast-boundary.processor.ts";
import type { CastBoundaryConfig, ControlSet, LoadedControlSet } from "../types.ts";

// ── Helpers ───────────────────────────────────────────────────────

function makeTestRoot(files: Record<string, string>): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lint-cast-boundary-test-"));
  for (const [filePath, content] of Object.entries(files)) {
    const full = path.join(tmpDir, filePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf-8");
  }
  return tmpDir;
}

function makeCtx(rootDir: string) {
  return { rootDir, allSourceGlobs: ["src/**/*.ts", "src/**/*.tsx"], ignorePatterns: [] };
}

function makeControlSets(config: CastBoundaryConfig): LoadedControlSet[] {
  return [
    {
      filePath: "scripts/lint/lint-controls.ts",
      packageDir: "scripts/lint",
      owner: "global",
      controls: {
        sourceGlobs: ["src/**/*.ts", "src/**/*.tsx"],
        "cast-boundary": config,
      } as ControlSet,
    },
  ];
}

const BASE_CONFIG: CastBoundaryConfig = {
  allowLists: {
    BetterAuth: [
      { path: "src/lib/auth.ts", rationale: "BetterAuth server setup" },
    ],
    Hono: [
      { path: "src/routes/**", rationale: "Hono routes" },
    ],
    TanStack: [
      { path: "src/route-tree.ts", rationale: "TanStack Router tree" },
    ],
  },
};

// ── Test runner ───────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    if (err instanceof Error) console.error(`    ${err.message}`);
    failed++;
  }
}

// ── Tests ─────────────────────────────────────────────────────────

await test("1. cast in allowed file with correct comment → no violation", async () => {
  const root = makeTestRoot({
    "src/lib/auth.ts": `const s = raw as AuthSession; // boundary: BetterAuth\n`,
  });
  const v = await processCastBoundaryControls(makeControlSets(BASE_CONFIG), makeCtx(root));
  fs.rmSync(root, { recursive: true });
  assert.equal(v.length, 0, `expected 0 violations, got ${v.length}`);
});

await test("2. cast in allowed file with missing comment → warn", async () => {
  const root = makeTestRoot({
    "src/lib/auth.ts": `const s = raw as AuthSession;\n`,
  });
  const v = await processCastBoundaryControls(makeControlSets(BASE_CONFIG), makeCtx(root));
  fs.rmSync(root, { recursive: true });
  assert.equal(v.length, 1);
  assert.equal(v[0].severity, "warn");
  assert.ok(v[0].message.includes("missing"), `message should contain "missing": ${v[0].message}`);
});

await test("3. cast in allowed file with wrong boundary comment → warn", async () => {
  const root = makeTestRoot({
    "src/lib/auth.ts": `const s = raw as AuthSession; // boundary: Drizzle\n`,
  });
  const v = await processCastBoundaryControls(makeControlSets(BASE_CONFIG), makeCtx(root));
  fs.rmSync(root, { recursive: true });
  assert.equal(v.length, 1);
  assert.equal(v[0].severity, "warn");
  assert.ok(v[0].message.includes("Drizzle"), `message should reference wrong boundary: ${v[0].message}`);
});

await test("4. cast in non-allowlisted file → error (comment irrelevant)", async () => {
  const root = makeTestRoot({
    // service file — not in any allowlist
    "src/services/user.service.ts": `const d = raw as UserData; // boundary: BetterAuth\n`,
  });
  const v = await processCastBoundaryControls(makeControlSets(BASE_CONFIG), makeCtx(root));
  fs.rmSync(root, { recursive: true });
  assert.equal(v.length, 1);
  assert.equal(v[0].severity, "error", `expected error, got ${v[0].severity}`);
});

await test("5. as const anywhere → no violation", async () => {
  const root = makeTestRoot({
    // non-allowlisted file — but `as const` is exempt
    "src/services/user.service.ts": `const ROLES = ['admin', 'member'] as const;\n`,
  });
  const v = await processCastBoundaryControls(makeControlSets(BASE_CONFIG), makeCtx(root));
  fs.rmSync(root, { recursive: true });
  assert.equal(v.length, 0);
});

await test("6. import/export alias → no violation", async () => {
  const root = makeTestRoot({
    // non-allowlisted file — but aliases are exempt
    "src/services/user.service.ts": [
      `import { Foo as Bar } from './foo';`,
      `export { Baz as Qux } from './baz';`,
    ].join("\n"),
  });
  const v = await processCastBoundaryControls(makeControlSets(BASE_CONFIG), makeCtx(root));
  fs.rmSync(root, { recursive: true });
  assert.equal(v.length, 0);
});

await test("7. boundary comment on preceding line → no violation", async () => {
  const root = makeTestRoot({
    "src/lib/auth.ts": [
      `// boundary: BetterAuth`,
      `const s = raw as AuthSession;`,
    ].join("\n"),
  });
  const v = await processCastBoundaryControls(makeControlSets(BASE_CONFIG), makeCtx(root));
  fs.rmSync(root, { recursive: true });
  assert.equal(v.length, 0);
});

await test("8. file on multiple boundaries — any listed boundary comment counts", async () => {
  const multiConfig: CastBoundaryConfig = {
    allowLists: {
      BetterAuth: [{ path: "src/lib/auth.ts", rationale: "BetterAuth" }],
      Hono: [{ path: "src/lib/auth.ts", rationale: "also Hono" }],
    },
  };
  const root = makeTestRoot({
    // file on both lists → either comment should pass
    "src/lib/auth.ts": `const s = raw as AuthSession; // boundary: Hono\n`,
  });
  const v = await processCastBoundaryControls(makeControlSets(multiConfig), makeCtx(root));
  fs.rmSync(root, { recursive: true });
  assert.equal(v.length, 0, "file on multiple lists should accept any listed boundary comment");
});

await test("9. deliberate-failure — comment cannot save a non-allowlisted file", async () => {
  // This is the key test: a file not on any allowlist must ERROR even if the
  // comment perfectly names a valid boundary. Comment-only gating is dead.
  const root = makeTestRoot({
    // service file explicitly not in the allowlist
    "src/services/legal.service.ts": [
      `// boundary: BetterAuth`,
      `const payload = raw as LegalPayload;`,
    ].join("\n"),
  });
  const v = await processCastBoundaryControls(makeControlSets(BASE_CONFIG), makeCtx(root));
  fs.rmSync(root, { recursive: true });
  assert.equal(v.length, 1);
  assert.equal(v[0].severity, "error", `expected ERROR — comment cannot save non-allowlisted file, got ${v[0].severity}`);
});

await test("11. multi-line import block aliases → no violation", async () => {
  // Regression: continuation lines inside `import {\n  X as Y,\n}` were
  // falsely flagged because IMPORT_EXPORT_LINE_RE only matched the opening line.
  const root = makeTestRoot({
    "src/services/user.service.ts": [
      `import {`,
      `  ORG_TYPES as PROWD_ORG_TYPES,`,
      `  PLATFORM_AUTH_CONFIG as PROWD_AUTH_CONFIG,`,
      `  roles,`,
      `} from '@configs/user-organization-mgmt';`,
    ].join("\n"),
  });
  const v = await processCastBoundaryControls(makeControlSets(BASE_CONFIG), makeCtx(root));
  fs.rmSync(root, { recursive: true });
  assert.equal(v.length, 0, `multi-line import aliases should not be flagged, got ${v.length} violation(s)`);
});

await test("10. processor disabled via enabled:false → no violations", async () => {
  const disabledConfig: CastBoundaryConfig = {
    enabled: false,
    allowLists: {},
  };
  const root = makeTestRoot({
    "src/services/user.service.ts": `const d = raw as UserData;\n`,
  });
  const v = await processCastBoundaryControls(makeControlSets(disabledConfig), makeCtx(root));
  fs.rmSync(root, { recursive: true });
  assert.equal(v.length, 0);
});

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
