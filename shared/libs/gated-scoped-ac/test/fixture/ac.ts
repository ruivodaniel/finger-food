// Wire the pure engine + the gate to the fixture config + schema. This mirrors
// the app's `ac.ts` (engine, config-bound) + the gate factory.

import { createAc, createGatedDb } from "../../src/index";
import { allPermissions, accountBaseline, forests } from "./config";
import { tables, type TestDb } from "./db";

export function makeAc() {
  const engine = createAc({
    tables,
    permissions: allPermissions,
    forests,
    accountBaseline,
    visibilityJoins: { note: [{ via: "note_share", fk: "noteId" }] },
  });
  return engine;
}

export function makeGate(db: TestDb, engine: ReturnType<typeof makeAc>) {
  return createGatedDb<typeof tables>(db, { tables, engine });
}
