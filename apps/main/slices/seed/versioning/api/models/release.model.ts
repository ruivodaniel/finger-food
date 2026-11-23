/** release — a version of main, numbered (1, 2, 3 per identity) and named. At most one current release per identity.
 * Only a version of main can be released: the service that writes releases checks it.
 * Labels are computed from releases when read. */
import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { authorTypeEnum, innerCapsule } from "./inner-capsule.model";
import { outerCapsule } from "./outer-capsule.model";

export const release = pgTable(
  "release",
  {
    id: text("id").primaryKey(),
    outerCapsuleId: text("outer_capsule_id").notNull().references(() => outerCapsule.id),
    innerCapsuleId: text("inner_capsule_id").notNull().references(() => innerCapsule.id),
    number: integer("number").notNull(),
    title: text("title"),
    description: text("description"),
    authorId: text("author_id").notNull(),
    authorType: authorTypeEnum("author_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("release_number_per_outer").on(table.outerCapsuleId, table.number),
    uniqueIndex("one_current_release").on(table.outerCapsuleId).where(sql`${table.validTo} is null`),
  ],
);

export type ReleaseSelect = typeof release.$inferSelect;
