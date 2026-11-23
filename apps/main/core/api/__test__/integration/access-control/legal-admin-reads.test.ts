/**
 * The legal documents page's reads over HTTP — `/legal-admin/*` on the UOM
 * slice's real router, services and drizzle repos (uom-app.ts) on PGlite, with
 * the shipping access-control config.
 *
 * The page is not gated: every signed-in caller gets the catalog (config) and
 * a scope's published versions (world-readable, AC22 — the same data the
 * consent screens serve). The draft is the engine's call: only the platform's
 * legal role (`manage_legal_document_platform`) sees it, and only it may save.
 *
 * Harness seed: one platform terms chain — ld-pub (v1, published) and
 * ld-draft (v2, draft).
 */

import { beforeEach, describe, expect, test } from "vitest";

import { accessControlConfig } from "@configs/access-control";

import { makeDb, type TestDb } from "./harness";
import { call, makeUomApp, type UomApp } from "./uom-app";

let db: TestDb;

const LEGAL_AUTHOR = { as: "u-legal", actingIn: "org-p" };
const SYSADMIN = { as: "u-sys", actingIn: "org-s" };
const COMPANY_MEMBER = { as: "u-std-a", actingIn: "org-a" };
const NO_ORG = { as: "u-nobody" };

function makeApp(): UomApp {
  return makeUomApp(db, accessControlConfig);
}

async function versionIds(app: UomApp, who: { as: string; actingIn?: string }) {
  const res = await call(app, "GET", "/legal-admin/documents?type=termsAndConditions", who);
  expect(res.status).toBe(200);
  return (res.body as unknown as { id: string }[]).map((v) => v.id);
}

beforeEach(async () => {
  db = await makeDb();
});

describe("legal documents page — reads (shipping config)", () => {
  test("the catalog answers every signed-in caller, author or not", async () => {
    const app = makeApp();
    for (const who of [LEGAL_AUTHOR, SYSADMIN, COMPANY_MEMBER, NO_ORG]) {
      const res = await call(app, "GET", "/legal-admin/catalog", who);
      expect(res.status).toBe(200);
      const groups = res.body as unknown as { orgTypeId: string | null }[];
      expect(groups.some((g) => g.orgTypeId === null)).toBe(true);
    }
  });

  test("the platform's legal role sees every version, the draft included", async () => {
    expect(await versionIds(makeApp(), LEGAL_AUTHOR)).toEqual(["ld-draft", "ld-pub"]);
  });

  test("everyone else sees the published history, never the draft", async () => {
    const app = makeApp();
    expect(await versionIds(app, SYSADMIN)).toEqual(["ld-pub"]);
    expect(await versionIds(app, COMPANY_MEMBER)).toEqual(["ld-pub"]);
    expect(await versionIds(app, NO_ORG)).toEqual(["ld-pub"]);
  });

  test("reading is all it grants: a system admin's save is refused", async () => {
    const app = makeApp();
    const res = await call(app, "PUT", "/legal-admin/documents/draft", SYSADMIN, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "Terms v2 (rewritten)",
      contentHtml: "<p>rewritten</p>",
    });
    expect(res.status).toBe(403);
    expect(await versionIds(app, LEGAL_AUTHOR)).toEqual(["ld-draft", "ld-pub"]);
  });
});
