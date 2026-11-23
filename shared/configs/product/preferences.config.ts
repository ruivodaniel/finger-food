/**
 * Product Preferences Configuration
 *
 * Layer 2 of the value-types-and-preferences architecture. Declares, per
 * preference field:
 *
 *   - default            The system fallback when no user override applies.
 *   - userOverridable    Whether users can override for themselves. When
 *                        `false`, the resolver short-circuits and always
 *                        returns the default — used for region-locked
 *                        products (e.g. a BR-only product locking currency
 *                        to "BRL"). The control is hidden in the UI.
 *   - allowSystemBinding Whether THIS product offers "Follow system" as
 *                        an option for this field. Independent from
 *                        `userOverridable` — a product can let users
 *                        override to a specific value while still
 *                        disallowing system-follow (e.g. for compliance
 *                        consistency or explicit-choice onboarding).
 *   - supported          Allowed subset — a readonly tuple narrowing the
 *                        value-types universe, or the literal "all" to
 *                        defer to the lib validator.
 *
 * Two independent capability layers govern system-follow:
 *
 *   Lib (value-types)  systemResolvable     Is it TECHNICALLY possible to
 *                                           detect from OS/browser?
 *   Config (product)   allowSystemBinding   Does THIS PRODUCT offer it?
 *
 * The UI shows "Follow system" only when BOTH are true. The lib's
 * capability is a hard ceiling enforced at compile time:
 * `allowSystemBinding: true` only type-checks for fields whose
 * `systemResolvable` is the literal `true` (see `FieldConfig` below).
 * Setting it to `true` on a non-systemResolvable field is a TS error.
 *
 * Runtime semantics:
 *
 *   - `supported: "all"` delegates validation to the value-types lib's
 *     runtime validator (e.g. `Intl.DateTimeFormat` for timezone). No
 *     curated tuple narrowing. Use when the full universe is acceptable
 *     and the authoritative list is engine-defined.
 *   - `supported: ["en","pt","es"]` (explicit tuple) restricts the API
 *     and UI to the listed values; the lib validator is still the
 *     final authority on what's *valid* at all.
 *
 * System-follow resolution itself is NOT configured here. It's runtime
 * logic in the resolver helper (Phase 5). This file describes policy
 * only: what's the default, who can override, and whether the product
 * exposes the system-follow option.
 */

import type { Locale, Timezone, Currency, Country } from "@libs/value-types";
import { locale, timezone, currency, country } from "@libs/value-types";

// ============================================================================
// Types
// ============================================================================

/**
 * Per-field preference config. `IsSystemResolvable` flows from the
 * value-types lib's literal `systemResolvable` constant, forcing
 * `allowSystemBinding: false` when the lib cannot detect a value.
 *
 * Distributive-conditional note: because the value-types exports use
 * `export const systemResolvable = true|false` (not `: boolean`), the
 * literal type is preserved through `typeof` and this conditional
 * discriminates cleanly.
 */
type FieldConfig<T, IsSystemResolvable extends boolean> = {
  default: T;
  userOverridable: boolean;
  allowSystemBinding: IsSystemResolvable extends true ? boolean : false;
  supported: readonly T[] | "all";
};

export type PreferencesConfig = {
  locale:   FieldConfig<Locale,   typeof locale.systemResolvable>;
  timezone: FieldConfig<Timezone, typeof timezone.systemResolvable>;
  currency: FieldConfig<Currency, typeof currency.systemResolvable>;
  country:  FieldConfig<Country,  typeof country.systemResolvable>;
};

// ============================================================================
// Values
// ============================================================================

/**
 * `as const satisfies PreferencesConfig` preserves literal typing
 * (`"en"` stays `"en"`, not `string`) while still type-checking shape.
 * Defaults outside the value-types tuples fail at compile time via this
 * clause.
 */
export const PREFERENCES = {
  locale:   { default: "en",  userOverridable: true, allowSystemBinding: true,  supported: "all" },
  timezone: { default: "UTC", userOverridable: true, allowSystemBinding: true,  supported: "all" },
  currency: { default: "EUR", userOverridable: true,  allowSystemBinding: false, supported: "all" },
  country:  { default: "US",  userOverridable: false, allowSystemBinding: false, supported: "all" },
} as const satisfies PreferencesConfig;

// Where a user's choice is stored, and how "follow system" vs an explicit
// value is recorded, belongs to the user-organization-mgmt slice
// (`user_preferences`); the app injects this policy into it at mount.
