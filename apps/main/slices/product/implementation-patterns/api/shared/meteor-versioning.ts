// What says that the entity "meteor" is the table meteor, and how it is versioned. The core gathers this from the slice's
// public surface into the versioning slice's list, and builds the meteors' gated db over a db that versions it.
import { defineVersionedEntity, type FieldDelta } from "@libs/versioning";
import { meteor, type MeteorSelect } from "../models/meteor.model";

/** Bookkeeping, not content: a version already says when it was made, and the row id is the version's own. */
const NOT_CHANGES = new Set<string>(["id", "createdAt", "updatedAt"]);

export const meteorVersionedEntry = defineVersionedEntity("meteor", {
  table: meteor,
  title: (row) => row.name,
  // What changed, as the library compares it by default, without the bookkeeping. The library also decides "nothing
  // changed, no version" with this, so a write that only touches updatedAt makes no version.
  delta: (from, to) =>
    (Object.keys(to) as (keyof MeteorSelect)[])
      .filter((field) => !NOT_CHANGES.has(field) && JSON.stringify(from[field]) !== JSON.stringify(to[field]))
      .map((field): FieldDelta => ({ field, from: from[field], to: to[field] })),
});
