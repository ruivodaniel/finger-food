# value-types

**What.** The universe of standardised value types: BCP 47 locales, IANA timezones, E.164 phone numbers, ISO 3166-1 countries, ISO 4217 currencies. Tuples + types + validators + OS-detection helpers.
**How.** One subfolder per domain. Each exports a value tuple (`as const`), a derived TS type, a Zod schema (or `Intl`-based runtime validator), metadata, a `systemResolvable` flag, and — when resolvable — a `detectSystemValue()` helper.
**Why.** Products need consistent, verifiable value sets. Having one source of truth per standard (not hand-rolled tuples per consumer) keeps validation, UI dropdowns, and DB enums in sync.

---

## For consumers

_Placeholder — expand as the lib is consumed in more places._ The current consumers are `@configs/product/preferences.config.ts` (which narrows the universe to product-supported subsets) and the module-level validators in `user-organization-mgmt`.

## For contributors

_Placeholder — expand when the lib gains new value-type domains._ Rules: pure data, `as const` tuples, zero product knowledge, no imports from modules/configs/apps.
