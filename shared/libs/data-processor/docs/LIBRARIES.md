# Dependencies and responsibility boundaries

The libraries below are **declared as actual dependencies and imported by source**. The cockpit calls the source; no duplicate formatting code lives in the cockpit.

| Dependency | What it does | Our code's job |
|---|---|---|
| `decimal.js` | Decimal arithmetic, precise decimal rounding | Select the agreed number mode, assemble minimal output |
| `Intl.NumberFormat` (platform) | Locale-aware number grouping / symbols | Keep suffix and value separate |
| `any-date-parser` | Broad best-effort date parsing, extracted date parts | Warn when insufficient/ambiguous; never invent a source zone |
| `luxon` | Date normalization, time-zone conversion, calendar arithmetic and duration difference | Source-zone precedence, shared temporal pipeline, output projection |
| `Intl.DateTimeFormat` (platform) | Month/day names and localized word forms | Format only explicitly selected fields, apply casing, remove trailing month abbreviation dot |
| `Intl.Segmenter` (platform) | Unicode-aware characters for text truncation/masking | Apply explicit text operations |

`d3-format` and Numbro were investigated but **not included** here: Number's five approved modes can be expressed with decimal.js plus native Intl without another formatter API. Adding one should require a demonstrated reduction in complexity.

`@js-temporal/polyfill` was also considered for calendar-aware rounding. This POC uses Luxon's calendar diff to avoid two competing temporal models. It may replace Luxon for Temporal features later, but only after tests demonstrate equivalent behavior.

## Important runtime/install constraint

The source relies on published open-source dependencies installed by `npm install`. The generated ZIP does **not** bundle node_modules or minified upstream source. The authoring environment could not reach npm registry, so the cockpit's runtime and full integration tests could **not** be executed here. They are prepared for normal local installation. Any successful verification claims must be limited to checks actually performed.
