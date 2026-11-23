// Type-only checks, run by `tsc` (typecheck), not by vitest: what must compile, and what must not (@ts-expect-error).
import { pgTable, text } from "drizzle-orm/pg-core";
import type { CapsuleTables } from "../src/index";
import { capsuleTables } from "./fixture/capsules";
import { author, makeClock, makeTestDb, makeVersioning } from "./fixture/db";

declare const db: Awaited<ReturnType<typeof makeTestDb>>;
const version = makeVersioning(makeClock());

export async function rowsAreTheEntitysOwn() {
  const row = await version.createFirstInnerCapsule(db, "meteor", "r1", "o1", author);
  const name: string = row.name;
  const diameter: string = row.diameterKm;
  return [name, diameter];
}

export async function aPatchIsSomeOfTheEntitysColumns() {
  await db.transaction(async (tx) => {
    const saved = await version.save(tx, "meteor", "o1", { name: "Ceres (dwarf)" }, author);
    const name: string | undefined = saved?.name;
    // @ts-expect-error a column the meteor table does not have
    await version.save(tx, "meteor", "o1", { nmae: "Ceres" }, author);
    // @ts-expect-error diameter_km is numeric: drizzle reads and writes it as a string
    await version.save(tx, "meteor", "o1", { diameterKm: 940 }, author);
    return name;
  });
}

export async function onlyEntitiesInTheMap() {
  // @ts-expect-error comet is not in the versioned list
  await version.createOuterCapsule(db, "comet");
}

export async function aHandleIsAPostgresDatabase() {
  // @ts-expect-error not a drizzle Postgres database or transaction
  await version.createOuterCapsule({ query: {} }, "meteor");
}

// A capsule table that lacks a column of the shape does not fit.
const noSeq = pgTable("outer_capsule", { entityId: text("entity_id") });
// @ts-expect-error outerCapsule lacks id, entityType, createdAt, validFrom, validTo
export const wrongShape = { ...capsuleTables, outerCapsule: noSeq } satisfies CapsuleTables;

// A delta hook reads the entity's own rows.
export const hook = makeVersioning(makeClock(), (from, to) => {
  // @ts-expect-error a column the meteor table does not have
  void from.nmae;
  return from.name === to.name ? [] : [{ field: "name", from: from.name, to: to.name }];
});
