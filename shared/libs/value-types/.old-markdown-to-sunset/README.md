# @libs/value-types

Universe of valid values for shared vocabulary backed by ISO/IANA/BCP 47/E.164 standards. Pure data + thin validators. **Zero product knowledge.**

## What it solves

Across most products you end up with the same five value types — locale, timezone, phone, country, currency — duplicated across i18n JSON, Zod schemas, and `<SelectItem>` lists. This lib is the upstream universe each product narrows in its own preferences config.

## Layering

```
shared/libs/value-types/        ← this lib: universe of valid values
        ↓
configs/<product>/              ← product narrows + sets defaults
        ↓
shared/modules/<module>/        ← per-user overrides + resolver
```

The lib never imports from `configs/`, `modules/`, or `apps/`.

## Subpaths

```ts
import { phoneSchema } from "@libs/value-types/phone";
import { localeSchema, LOCALES } from "@libs/value-types/locale";
import { isTimezone, TIMEZONES, groupTimezonesByRegion } from "@libs/value-types/timezone";
import { countrySchema, getCountryMeta } from "@libs/value-types/country";
import { currencySchema, getCurrencyMeta } from "@libs/value-types/currency";
```

Or all at once:

```ts
import { phoneSchema, localeSchema, currencySchema } from "@libs/value-types";
```

## What each subfolder exports

| Subfolder | Tuple | Type | Schema | Metadata helper |
|-----------|-------|------|--------|-----------------|
| `locale`   | `LOCALES`     | `Locale`     | `localeSchema`     | `getLocaleMeta(code)` (CLDR via `Intl.DisplayNames`) |
| `timezone` | `TIMEZONES`*  | `Timezone`   | `timezoneSchema`** | `groupTimezonesByRegion()` |
| `phone`    | —             | `Phone`      | `phoneSchema`      | `isE164(value)`, `E164_REGEX` |
| `country`  | `COUNTRIES`   | `Country`    | `countrySchema`    | `getCountryMeta(code)` (name, dialing code, flag) |
| `currency` | `CURRENCIES`  | `Currency`   | `currencySchema`   | `getCurrencyMeta(code)` (name, symbol, decimals) |

\* `TIMEZONES` is read from `Intl.supportedValuesOf("timeZone")` at module load.
\** `timezoneSchema` is a runtime `refine` backed by `Intl.DateTimeFormat`, not `z.enum`.

## Adding a new value to the curated set

For `country` / `currency` / `locale`: append to the data file. No other change needed — types and the Zod schema widen automatically.

For `timezone`: nothing — the runtime list reflects what the JS engine knows.

For `phone`: there's no curated list; E.164 covers the universe by construction.
