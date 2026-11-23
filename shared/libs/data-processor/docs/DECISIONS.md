# Decision log (append-only)

Past decisions are not overwritten by later discussion unless explicitly superseded. This is a reconstruction of the approved direction from the conversation, not a replacement for a real team ADR process.

| ID | State | Decision |
|---|---|---|
| D01 | Agreed | One library, independent Data Processing and Conditional Formatting modules. |
| D02 | Agreed | Data types: Number, Text, Date/Time, Duration. No Boolean, Identifier, or Range processors. Masking is a Text operation. |
| D03 | Agreed | Number has five modes: Full, Compact Max N, Compact Fixed N, Fixed Scale N, Scientific N (engineering variant). N means different things by mode. |
| D04 | Agreed | Fixed Scale must not have an integer-digit cap. Decimal alignment is presentation/collection concern. |
| D05 | Agreed | Date/Time receives unknown inputs and extracts best effort; individual output fields are independently requested, without separators. |
| D06 | Agreed | Locale is retained for language; token chooses representation, casing is separate. Month abbreviations must not introduce a dot. |
| D07 | Agreed | Runtime source time zone overrides config-time source time zone; missing source zone blocks requested conversion and produces a warning. Embedded offsets are authoritative. |
| D08 | Agreed | Missing input time becomes midnight. Milliseconds supported. |
| D09 | Agreed | Duration reuses shared temporal normalization; two endpoints may have separate source zones. |
| D10 | Agreed | Duration returns numeric `{value,unit}` parts, optional `round` and optional `composed`, with warnings. |
| D11 | Agreed | Duration supports calendar years/months/weeks; `maxParts` is only output length, must not recalculate or skip units. |
| D12 | Agreed | Each version is saved separately. Cockpit cannot implement processing logic. |
| D13 | Agreed | Prefer mature OSS libraries over bespoke algorithms wherever practical. |

## Proposed / requires review

- P01: Public names and diagnostics taxonomy in `contracts.ts` (the structure is a **proposal**, not an approved implementation API).
- P02: Number rounding defaults to decimal `half-up`; how percentage fractions/points are represented is explicit rather than inferred.
- P03: Compact unscaled values cap fractional output to two places; extremely small inputs can become zero.
- P04: Time-only / month-day-only inputs cannot establish calendar instants; field extraction is still allowed.
- P05: Ambiguous numeric dates cannot be resolved with certainty from an unknown source; the production implementation should expose ambiguity warnings and reject guesses if required.
- P06: DST overlaps/gaps need an explicit policy; Luxon's default interpretation should not silently become the contractual policy.
- P07: Duration's calendar comparison zone defaults to the From instant zone if available; confirm whether the host should always provide one.
- P08: `round` currently chooses the *largest unit that rounds to a nonzero integer*. Confirm thresholds independently of decomposition.
- P09: Rounding the last duration part and carrying overflow (e.g. seconds to minutes) needs a precise rule before production.
- P10: Output `warnings` currently always exists as an array. Decide whether empty warnings are omitted.

## Explicitly excluded from this proof of concept

- Final published package/bundling pipeline and serverless compatibility audit.
- Dynamic plugin/formatter registration and renderer integrations.
- Live time updates or timers in the processor; inject deterministic `now` where needed.
- Full international date ambiguity resolution (unknown input is inherently sometimes ambiguous).
- Frontend masking as security (must be done before data reaches untrusted clients).
