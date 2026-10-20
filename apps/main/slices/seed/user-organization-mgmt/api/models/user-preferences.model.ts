/**
 * User preferences schema — one row per user: how locale and timezone
 * resolve for them (follow the system, or an explicit value) and, where the
 * product lets users override them, their chosen currency and country.
 *
 * No row, or a null column, means the product's default — the policy the app
 * injects at mount (`preferences`). Keyed by user id like `user_profile`: a
 * user's preferences ARE that user's.
 */

import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { PREFERENCE_SOURCES } from "../../shared/types/preferences";
import { uomUser } from "./user.model";

export const uomPreferenceSource = pgEnum("preference_source", PREFERENCE_SOURCES);

export const uomUserPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => uomUser.id, { onDelete: "cascade" }),
  /** Null until the user chooses — the product's default binding applies. */
  localeSource: uomPreferenceSource("locale_source"),
  /** Set only when localeSource is "explicit". */
  localeValue: text("locale_value"),
  timezoneSource: uomPreferenceSource("timezone_source"),
  timezoneValue: text("timezone_value"),
  currencyValue: text("currency_value"),
  countryValue: text("country_value"),
  updatedAt: timestamp("updated_at").notNull(),
});
export type UomUserPreferencesSelect = typeof uomUserPreferences.$inferSelect;
