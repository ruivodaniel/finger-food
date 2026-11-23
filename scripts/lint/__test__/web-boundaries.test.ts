#!/usr/bin/env node
// ── Web Boundaries Tests ──────────────────────────────────────────
// Run: node --experimental-strip-types scripts/lint/__test__/web-boundaries.test.ts
//
// One core and two slices in a temp tree. Every rule gets one import that
// passes and one that fails; the shape check gets a missing folder.

import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { processWebBoundariesControls } from "../processors/web-boundaries.processor.ts";
import { webControls } from "../web-controls.ts";
import type { ControlSet, LintViolation, LoadedControlSet, WebLayout } from "../types.ts";

// ── Helpers ───────────────────────────────────────────────────────

const layout: WebLayout = {
  core: "app/web/src",
  slices: ["slices/*/web"],
  aliases: [
    { pattern: "^@/(.*)$", to: ["app/web/src/$1"] },
    { pattern: "^@modules/([^/]+)/web(/.*)?$", to: ["slices/$1/web$2"] },
  ],
};

function makeTestRoot(files: Record<string, string>): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lint-web-boundaries-test-"));
  for (const [filePath, content] of Object.entries(files)) {
    const full = path.join(tmpDir, filePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf-8");
  }
  return tmpDir;
}

function controlSets(): LoadedControlSet[] {
  const web = webControls(layout, { severity: "error" });
  return [{
    filePath: "scripts/lint/lint-controls.ts",
    packageDir: "scripts/lint",
    owner: "global",
    controls: { sourceGlobs: ["**/*.{ts,tsx}"], "web-boundaries": web } as ControlSet,
  }];
}

// A slice of the full shape, so the shape check stays quiet unless a test removes something.
const SHAPE = ["shared/layouts", "shared/components", "shared/hooks", "shared/helpers", "pages", "services/application", "services/api", "store", "routes"];
const slice = (name: string, files: Record<string, string>): Record<string, string> => ({
  ...Object.fromEntries(SHAPE.map((d) => [`slices/${name}/web/${d}/.gitkeep`, ""])),
  ...Object.fromEntries(Object.entries(files).map(([f, c]) => [`slices/${name}/web/${f}`, c])),
});

const FILES: Record<string, string> = {
  // ── the core
  "app/web/src/main.tsx": "",
  "app/web/src/env.ts": "",
  ...Object.fromEntries(["shared/shell", "shared/layouts", "shared/components", "shared/helpers", "services/api", "store", "config", "routes", "assets"].map((d) => [`app/web/src/${d}/.gitkeep`, ""])),
  "app/web/src/shared/components/AccountSidebar.tsx": [
    'import { OrgSwitcher } from "@modules/orgs/web";',                              // 2 pass
    'import { Bell } from "@modules/notes/web/shared/components/Bell";',            // 2 FAIL
  ].join("\n"),
  "app/web/src/services/api/client.ts": 'import { OrgSwitcher } from "@modules/orgs/web";', // 12 FAIL (and 2 pass)

  
  // ── slice orgs
  ...slice("orgs", {
    "index.ts": [
      'export { OrgSwitcher } from "./shared/components/OrgSwitcher";',
      'export { organizationsService } from "./services/application/organizations.service";',
      'export { MembersPage } from "./pages/members/MembersPage";',
      'export { useOrg } from "./shared/hooks/use-org";',
    ].join("\n"),
    "shared/hooks/use-org.ts": "export const useOrg = () => null;",
    "shared/components/OrgSwitcher.tsx": [
      'import { organizationsService } from "../../services/application/organizations.service";', // 7 pass
      'import { organizationApi } from "../../services/api/organization.api";',                    // 7 FAIL
      'import { env } from "@/env";',                                                               // 3 FAIL
      "export const OrgSwitcher = () => fetch('/x');",                                              // 8 FAIL
    ].join("\n"),
    "services/application/organizations.service.ts": 'import { organizationApi } from "../api/organization.api";\nexport const organizationsService = {};', // 7 pass
    "services/api/organization.api.ts": "export const organizationApi = {};",
    "store/active-org.ts": "export const read = () => store.getState();",          // 9 pass (inside store/)
    "routes/get-routes.ts": [
      'import { MembersPage } from "../pages/members/MembersPage";', // 6 pass (routes → page file)
      'import { Row } from "../pages/members/components/Row";',     // 6 FAIL (routes → page internals)
    ].join("\n"),
    "pages/members/MembersPage.tsx": 'import { Row } from "./components/Row";\nexport const MembersPage = () => null;', // 6 pass (same page)
    "pages/members/components/Row.tsx": "export const Row = () => null;",
    "pages/members/hooks/.gitkeep": "",
    "pages/members/helpers/format.ts": [
      'import { pad } from "../../../shared/helpers/pad";',  // 11 pass
      'import { useState } from "react";',                  // 11 pass (package)
      'import { Row } from "../components/Row";',           // 11 FAIL
    ].join("\n"),
    "pages/settings/SettingsPage.tsx": [
      'import { Row } from "../members/components/Row";',   // 6 FAIL
      "useOrgStore.setState({ id: 1 });",                   // 9 FAIL
    ].join("\n"),
    "pages/settings/components/.gitkeep": "",
    "pages/settings/hooks/.gitkeep": "",
    "pages/settings/helpers/.gitkeep": "",
    "shared/helpers/pad.ts": "export const pad = 1;",
  }),

  // ── slice notes (no services/application: shape FAIL)
  ...Object.fromEntries(Object.entries(slice("notes", {
    "index.ts": 'export { Bell } from "./shared/components/Bell";',
    "shared/components/Bell.tsx": [
      'import { OrgSwitcher } from "@modules/orgs/web";',                         // 4 pass
      'import { organizationsService, MembersPage } from "@modules/orgs/web";',  // 4 pass (a service, a page)
      'import { useOrg } from "@modules/orgs/web";',                              // 4 FAIL (a hook)
      'import { organizationApi } from "@modules/orgs/web/services/api/organization.api";', // 4 FAIL (internal), 7 FAIL
    ].join("\n"),
  })).filter(([f]) => !f.startsWith("slices/notes/web/services/application/"))),
};

const root = makeTestRoot(FILES);
const ctx = { rootDir: root, allSourceGlobs: ["**/*.{ts,tsx}"], ignorePatterns: [] };
const sets = controlSets();

const boundaries = await processWebBoundariesControls(sets, ctx);
const content = boundaries;
const shape = boundaries;

const at = (vs: LintViolation[], id: string, file: string) => vs.filter((v) => v.id === id && v.file === file);
const count = (vs: LintViolation[], id: string) => vs.filter((v) => v.id === id).length;
let passed = 0;
const check = (name: string, fn: () => void) => { fn(); passed++; console.log(`  ✓ ${name}`); };

// ── Rules ─────────────────────────────────────────────────────────

check("2 · the core through web/index.ts passes, a deep import fails", () => {
  const v = boundaries.filter((x) => x.id === "web-core-via-index");
  assert.equal(v.length, 1);
  assert.equal(v[0].file, "app/web/src/shared/components/AccountSidebar.tsx");
  assert.deepEqual(v[0].lines, [2]);
});

check("3 · a slice importing the core fails", () => {
  assert.equal(at(boundaries, "web-slice-no-core", "slices/orgs/web/shared/components/OrgSwitcher.tsx").length, 1);
  assert.equal(count(boundaries, "web-slice-no-core"), 1);
});

check("4 · another slice: components, services and a page pass; a hook and an internal file fail", () => {
  const v = at(boundaries, "web-slice-components-only", "slices/notes/web/shared/components/Bell.tsx");
  assert.equal(v.length, 2);
  assert.ok(v.some((x) => x.message.includes('"useOrg"')));
  assert.ok(v.some((x) => x.message.includes("internal file")));
  assert.ok(!v.some((x) => x.message.includes('"OrgSwitcher"')));
  assert.ok(!v.some((x) => x.message.includes('"organizationsService"')));
  assert.ok(!v.some((x) => x.message.includes('"MembersPage"')));
});

check("6 · same page and routes → page file pass; another page, the index and routes → page internals fail", () => {
  const v = boundaries.filter((x) => x.id === "web-page-private").map((x) => `${x.file}:${x.lines}`).sort();
  assert.deepEqual(v, ["slices/orgs/web/index.ts:3", "slices/orgs/web/pages/settings/SettingsPage.tsx:1", "slices/orgs/web/routes/get-routes.ts:2"]);
});

check("7 · services/api from services/application passes, from a component or another slice fails", () => {
  assert.equal(at(boundaries, "web-api-only-from-application", "slices/orgs/web/shared/components/OrgSwitcher.tsx").length, 1);
  assert.equal(at(boundaries, "web-api-only-from-application", "slices/notes/web/shared/components/Bell.tsx").length, 1);
  assert.equal(count(boundaries, "web-api-only-from-application"), 2);
});

check("8 · fetch in a component fails", () => {
  assert.equal(at(boundaries, "web-logic-via-application", "slices/orgs/web/shared/components/OrgSwitcher.tsx").length, 1);
  assert.equal(count(boundaries, "web-logic-via-application"), 1);
});

check("9 · raw setState outside the store fails, inside the store passes", () => {
  const v = content.filter((x) => x.id === "web-store-no-raw-access");
  assert.equal(v.length, 1);
  assert.equal(v[0].file, "slices/orgs/web/pages/settings/SettingsPage.tsx");
});

check("11 · helpers: helpers and packages pass, a component fails", () => {
  const v = boundaries.filter((x) => x.id === "web-helpers-pure");
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].lines, [3]);
});

check("12 · the core's services/api importing a slice fails", () => {
  assert.equal(at(boundaries, "web-core-no-application", "app/web/src/services/api/client.ts").length, 1);
});

check("shape · a missing folder fails, a complete slice passes", () => {
  const v = shape.filter((x) => x.id === "web-shape-slice");
  assert.equal(v.length, 1);
  assert.equal(v[0].file, "slices/notes/web");
  assert.ok(v[0].message.includes("services/application/"));
  assert.equal(count(shape, "web-shape-core"), 0);
  assert.equal(count(shape, "web-shape-page"), 0);
});

fs.rmSync(root, { recursive: true, force: true });
console.log(`\n${passed} checks passed.`);
