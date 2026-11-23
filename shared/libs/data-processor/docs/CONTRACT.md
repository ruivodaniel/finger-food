# Public contract — proposal v0.1

This file is the primary design artifact. The UI is only a consumer.

## The rule

Each processor is a **pure-ish function of `input` and `config` returning `output`**, except when `to: now` is used without injected `config.now`. No DOM dependency or output markup. Errors and assumptions are explicit diagnostics; an ordinary missing field does not cause the entire result to throw.

```
processNumber(input: NumberInput, config: NumberConfig): NumberOutput
processText(input: TextInput, config: TextConfig): TextOutput
processDateTime(input: TemporalInput, config: DateTimeConfig): DateTimeOutput
processDuration(input: DurationInput, config: DurationConfig): DurationOutput
evaluateConditional(input: ConditionalInput, config: ConditionalConfig): ConditionalOutput
```

`Conditional` is a distinct module. It may evaluate the raw data and return semantic state, but knows nothing about the formatter or renderer.

## Number (approved five-mode model)

| Mode | N | Scaling | Example |
|---|---|---|---|
| `full` | absent | none | `3,476,543,210` |
| `compactMax` | maximum significant digits | automatic | `34.8` + `M` |
| `compactFixed` | exact significant digits | automatic | `1.00` + `M` |
| `fixedScale` | exact digits **after decimal** | explicit | `3,476.54` + `M` |
| `scientific` | significant digits | exponent | `2.00` + `e−6` as separate fields |

```ts
const input = {value: 3476543210};
const config = {mode:{kind:'fixedScale',scale:'million',n:2}};
const output = {value:'3,476.54',unit:'M',warnings:[]};
```

**No arbitrary integer-digit cap in fixed scale.** Full means no K/M/B. The numeric output contains no currency symbol; currency, icon, arrows, decorations, placement, and theming belong to the frontend. Locale affects only separators and textual symbols. `input.value` can be a decimal string to avoid losing large numeric precision before it reaches the library.

A percentage is a **number representation** (`representation.kind='percentage'`) rather than a separate processor or currency. The input basis is explicit (`fraction` or `points`). The returned `%` is an independent `unit` field.

## Text

```ts
const input = {value:'Product Architecture Redesign'};
const config = {operation:{kind:'initials'}};
const output = {value:'PAR',warnings:[]};
```

Text supports truncation, initialisms, casing, masking. No Identifier processor. Masking in a frontend is **not** a security boundary: redact actual secrets on the backend.

## Date/Time

```ts
const input = {value:'2026-10-07T09:20:35.123Z'};
const config = {
  locale:'pt-PT',                // host-supplied language; retained by agreement
  targetTimeZone:'Europe/Lisbon',
  fields:{day:'dd',month:{token:'MMMM',casing:'title'},hour:'HH',minute:'mm'}
};
const output = {day:'07',month:'Outubro',hour:'10',minute:'20',warnings:[]};
```

**No input format selector.** Parsing is best-effort using `any-date-parser`; a recognized ISO timestamp or JS `Date` can be normalized by Luxon. Output tokens specify *individual fields*, never an assembled date string; no separators or layout. Locale is explicit/host-supplied and is separate from token selection and casing. Month abbreviations omit trailing dots by agreed product policy.

Input `timeZone` (runtime) overrides config `sourceTimeZone` for naive sources. Embedded offset/Z or epoch is already a known instant and takes precedence. If a target zone is requested but source zone is unknown, **do not convert**: return extracted wall-clock fields and a warning. Missing time defaults to midnight with a warning. Missing date parts remain missing; report any requested field that cannot be produced.

## Duration

```ts
const input = {
  from:{value:'2026-10-07T09:00:00Z'},
  to:{value:'2026-10-07T11:59:00Z'},
};
const config = {smallestUnit:'minutes',maxParts:3,round:true};
const output = {
  parts:[{value:2,unit:'hours'},{value:59,unit:'minutes'}],
  round:{value:3,unit:'hours'},
  warnings:[]
};
```

Both endpoints use the **same** temporal normalizer. Full hierarchy: years → months → weeks → days → hours → minutes → seconds → milliseconds. `maxParts` slices the already-calculated `parts` array; it must never skip or recompute units. `round` is independent and derived from the full duration, not the shortened `parts`. Optional `composed` is rendered only if the consumer explicitly requests it; its labels and separators are independently configured.

Time-zone scenarios: both known → compute exact instants; one known → assume the other's zone for the unknown endpoint with a warning; neither known → compare as same unspecified wall-clock zone with warning. Calendar units are measured using real calendar dates (not 30-day months / 365-day years). `config.calendarTimeZone` explicitly chooses a calendar basis when desired.

## Output warnings

Each result has `warnings: {code,message,field?}[]`. The warning codes are a proposed prototype vocabulary; stabilize them before production.

Examples: `zone_conversion_skipped`, `assumed_source_zone`, `assumed_same_unknown_zone`, `missing_field`, `invalid_date`.

## Conditional formatting (independent)

```ts
const input = {value:0.15};
const config = {rules:[{id:'cost-up',when:{operator:'gt',value:0},state:'warning'}]};
const output = {state:'warning',matchedRule:'cost-up',warnings:[]};
```

The rule returns a semantic state. The product's theme—not this library—decides what that means visually. Positive does **not** imply success.
