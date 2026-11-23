/**
 * Member allowance — what an organization lets one member spend, renewing each
 * calendar period (UTC). No row means no limit, and only organization credits
 * have them. A row with no `user_id` is the rule for every member without one
 * of their own; the first time such a member is touched they get a row of
 * their own marked `inherited`, because a member's own count starts then.
 *
 * Spent is never stored: it is the sum of the member's charge and refund rows.
 * What a top-up member has left is `carried`, plus the amount for every period
 * from `accrues_from`, minus what they spent from `counted_from`.
 *
 * `organization_id` repeats the account's owner so the access rule that lets a
 * member read their own allowance can target it.
 */

import { sql } from "drizzle-orm";
import { boolean, check, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { ALLOCATION_PERIODS, UNSPENT_MODES } from "../../shared/types";
import { creditAccount } from "./credit-account.model";

export const allocationPeriodEnum = pgEnum("allocation_period", ALLOCATION_PERIODS);
export const unspentModeEnum = pgEnum("unspent_mode", UNSPENT_MODES);

export const memberAllowance = pgTable(
  "member_allowance",
  {
    id: text("id").primaryKey(),
    /** an organization-owned credit account */
    accountId: text("account_id")
      .notNull()
      .references(() => creditAccount.id, { onDelete: "cascade" }),
    /** the person's id, no FK — the member. Null: every member without a rule of their own */
    userId: text("user_id"),
    /** the organization's id, no FK — repeated for the access rule */
    organizationId: text("organization_id").notNull(),
    period: allocationPeriodEnum("period").notNull(),
    unspent: unspentModeEnum("unspent").notNull(),
    /** the amount each period, above zero */
    credits: integer("credits").notNull(),
    /** the catalog services the member may spend it on, sorted. Null: any */
    serviceKeys: text("service_keys").array(),
    /** each period's credits are created on the organization, as the caller who saved it was permitted to */
    createsCredits: boolean("creates_credits").notNull().default(false),
    /** this member follows the organization's rule for every member */
    inherited: boolean("inherited").notNull().default(false),
    /** top up only: what the member had left when the amount last changed */
    carried: integer("carried").notNull().default(0),
    /** top up only: spending is counted from here */
    countedFrom: timestamp("counted_from").notNull(),
    /** top up only: the first period start that adds the amount */
    accruesFrom: timestamp("accrues_from").notNull(),
    /** creating rules only: credits are created up to here */
    issuedUntil: timestamp("issued_until"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("member_allowance_member_uniq")
      .on(table.accountId, table.userId)
      .where(sql`user_id is not null`),
    uniqueIndex("member_allowance_default_uniq")
      .on(table.accountId)
      .where(sql`user_id is null`),
    check("member_allowance_credits_check", sql`credits > 0 and carried >= 0`),
  ],
);
export type MemberAllowanceSelect = typeof memberAllowance.$inferSelect;
export type MemberAllowanceInsert = typeof memberAllowance.$inferInsert;
