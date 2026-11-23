/**
 * /me/preferences over HTTP — the UOM slice's real router, service and gated
 * repo (uom-app.ts) on PGlite, with the shipping access-control config and the
 * product's preferences policy injected at mount, as the app does.
 *
 * The policy decides what may change (locale/timezone/currency overridable,
 * country set by the product); the DSL decides whose row (own only).
 */

import { beforeEach, describe, expect, test } from "vitest";

import { accessControlConfig } from "@configs/access-control";
import { PREFERENCES } from "@configs/product/preferences.config";

import { makeDb, type TestDb } from "./harness";
import { call, makeUomApp } from "./uom-app";

let db: TestDb;
const STD = { as: "u-std-a" };
const OTHER = { as: "u-owner-b" };

beforeEach(async () => {
  db = await makeDb();
});

describe("/me/preferences (shipping config + product policy)", () => {
  test("answers the product defaults before any choice", async () => {
    const res = await call(makeUomApp(db), "GET", "/me/preferences", STD);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      locale: { source: "system", value: null },
      timezone: { source: "system", value: null },
      currency: PREFERENCES.currency.default,
      country: PREFERENCES.country.default,
    });
  });

  test("stores an explicit choice, and can go back to following the system", async () => {
    const app = makeUomApp(db);
    const first = await call(app, "PATCH", "/me/preferences", STD, {
      locale: { source: "explicit", value: "pt" },
      timezone: { source: "explicit", value: "Europe/Lisbon" },
    });
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({
      locale: { source: "explicit", value: "pt" },
      timezone: { source: "explicit", value: "Europe/Lisbon" },
    });

    const back = await call(app, "PATCH", "/me/preferences", STD, {
      timezone: { source: "system" },
    });
    expect(back.body).toMatchObject({
      locale: { source: "explicit", value: "pt" },
      timezone: { source: "system", value: null },
    });
    expect((await call(app, "GET", "/me/preferences", STD)).body).toMatchObject({
      locale: { source: "explicit", value: "pt" },
      timezone: { source: "system", value: null },
    });
  });

  test("a currency is the user's to pick from the supported list, and to clear", async () => {
    const app = makeUomApp(db);
    const set = await call(app, "PATCH", "/me/preferences", STD, { currency: "GBP" });
    expect(set.status).toBe(200);
    expect(set.body.currency).toBe("GBP");
    const unknown = await call(app, "PATCH", "/me/preferences", STD, { currency: "XYZ" });
    expect(unknown.status).toBe(400);
    expect((await call(app, "GET", "/me/preferences", STD)).body.currency).toBe("GBP");
    const cleared = await call(app, "PATCH", "/me/preferences", STD, { currency: null });
    expect(cleared.body.currency).toBe(PREFERENCES.currency.default);
  });

  test("refuses what the policy doesn't allow (400)", async () => {
    const app = makeUomApp(db);
    const locked = await call(app, "PATCH", "/me/preferences", STD, { country: "ES" });
    expect(locked.status).toBe(400);
    expect(locked.body.error).toMatch(/country is set by the product/);
    const badLocale = await call(app, "PATCH", "/me/preferences", STD, {
      locale: { source: "explicit", value: "xx" },
    });
    expect(badLocale.status).toBe(400);
    const badZone = await call(app, "PATCH", "/me/preferences", STD, {
      timezone: { source: "explicit", value: "Mars/Base" },
    });
    expect(badZone.status).toBe(400);
    // the shape is strict: no user id (or anything else) rides the body
    const smuggled = await call(app, "PATCH", "/me/preferences", STD, { userId: "u-owner-b" });
    expect(smuggled.status).toBe(400);
  });

  test("keeps each user's choices to themselves", async () => {
    const app = makeUomApp(db);
    await call(app, "PATCH", "/me/preferences", STD, {
      locale: { source: "explicit", value: "pt" },
    });
    expect((await call(app, "GET", "/me/preferences", OTHER)).body.locale).toEqual({
      source: "system",
      value: null,
    });
    await call(app, "PATCH", "/me/preferences", OTHER, {
      locale: { source: "explicit", value: "es" },
    });
    expect((await call(app, "GET", "/me/preferences", STD)).body.locale).toEqual({
      source: "explicit",
      value: "pt",
    });
  });

  test("denies by default: without the own-preferences permissions nothing is written", async () => {
    const baseline = accessControlConfig.accountBaseline.map((role) => ({
      ...role,
      permissions: (role.permissions ?? []).filter((p) => !p.endsWith("_own_preferences")),
    }));
    const app = makeUomApp(db, { ...accessControlConfig, accountBaseline: baseline });
    const res = await call(app, "PATCH", "/me/preferences", STD, {
      locale: { source: "explicit", value: "pt" },
    });
    expect(res.status).toBe(403);
    // and with the shipping config, the row is still not there
    const after = await call(makeUomApp(db), "GET", "/me/preferences", STD);
    expect((after.body.locale as { source: string }).source).toBe("system");
  });
});
