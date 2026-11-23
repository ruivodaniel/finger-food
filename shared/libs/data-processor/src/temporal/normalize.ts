import parser from 'any-date-parser';
import { DateTime } from 'luxon';
import type { Diagnostic, TemporalInput } from '../contracts';

export type TemporalFields = Partial<Record<'year'|'month'|'day'|'hour'|'minute'|'second'|'millisecond',number>>;
export type NormalizedTemporal = {
  fields: TemporalFields;
  /** Only exists when a valid calendar date and a time zone (embedded or supplied) establish an instant. */
  instant?: DateTime;
  /** Safe UTC arithmetic coordinate; NEVER interprets an unknown wall time as a known UTC instant. */
  wall?: DateTime;
  zone?: string;
  warnings: Diagnostic[];
};
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[Tt\s].*)?$/;
const ISO_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const asFields = (dt: DateTime): TemporalFields => ({
  year: dt.year, month: dt.month, day: dt.day,
  hour: dt.hour, minute: dt.minute, second: dt.second, millisecond: dt.millisecond,
});
function zoneIsValid(zone: string): boolean { return DateTime.now().setZone(zone).isValid; }

/** One shared normalization step. No output formatting, UI, or custom date grammar. */
export function normalizeTemporal(
  input: TemporalInput,
  configSourceTimeZone?: string,
  locale = 'en-US',
): NormalizedTemporal {
  const warnings: Diagnostic[] = [];
  const sourceZone = input.timeZone ?? configSourceTimeZone;
  if (sourceZone && !zoneIsValid(sourceZone)) {
    return {fields: {}, warnings: [{code:'invalid_source_zone', message:`Unrecognized time zone: ${sourceZone}`}]};
  }
  let fields: TemporalFields = {};
  let explicitInstant: DateTime | undefined;
  let embeddedZone: string | undefined;
  if (input.value instanceof Date) {
    explicitInstant = DateTime.fromJSDate(input.value, {zone: 'utc'});
    if (!explicitInstant.isValid) return {fields:{}, warnings:[{code:'invalid_date', message:'Invalid JavaScript Date'}]};
    embeddedZone = 'UTC';
    fields = asFields(explicitInstant);
  } else if (typeof input.value === 'number') {
    // Number is defined as UNIX epoch milliseconds, matching JS Date semantics.
    explicitInstant = DateTime.fromMillis(input.value, {zone:'utc'});
    if (!explicitInstant.isValid) return {fields:{}, warnings:[{code:'invalid_epoch', message:'Invalid epoch milliseconds'}]};
    embeddedZone = 'UTC';
    fields = asFields(explicitInstant);
  } else {
    const text = input.value.trim().replace(/z$/, 'Z');
    if (!text) return {fields:{}, warnings:[{code:'empty_input', message:'The input is empty.'}]};
    if (/^\d{10}$/.test(text) || /^\d{13}$/.test(text)) {
      explicitInstant = /^\d{10}$/.test(text)
        ? DateTime.fromSeconds(Number(text), {zone:'utc'})
        : DateTime.fromMillis(Number(text), {zone:'utc'});
      embeddedZone = 'UTC';
      fields = asFields(explicitInstant);
    } else if (ISO_DATE.test(text)) {
      const hasOffset = ISO_OFFSET.test(text);
      const dt = DateTime.fromISO(text, {zone: 'utc', setZone: hasOffset});
      if (dt.isValid) {
        if (hasOffset) {
          explicitInstant = dt;
          embeddedZone = dt.zoneName ?? 'UTC';
          fields = asFields(dt);
        } else {
          fields = asFields(dt);
          if (!/[Tt\s]\d{1,2}:\d{2}/.test(text)) {
            warnings.push({code:'assumed_midnight',message:'No time supplied; normalized to 00:00:00.000.'});
          }
        }
      }
    }
    if (!Object.keys(fields).length) {
      // Third-party, best-effort parser; use attempt() so omitted fields stay omitted.
      const attempt = parser.attempt(text, locale) as Record<string, unknown>;
      if (attempt.invalid) return {fields:{}, warnings:[{code:'unparsed_date', message:String(attempt.invalid)}]};
      // Ambiguous numeric dates cannot be made unambiguous by a parser.
      const ambiguous = text.match(/^(\d{1,2})[\/.](\d{1,2})[\/.]\d{4}$/);
      if (ambiguous && Number(ambiguous[1])<=12 && Number(ambiguous[2])<=12) {
        warnings.push({code:'ambiguous_numeric_date',message:'Numeric day/month ordering is ambiguous; parser interpretation may be wrong.'});
      }
      for (const key of ['year','month','day','hour','minute','second','millisecond'] as const) {
        if (typeof attempt[key] === 'number') fields[key] = attempt[key] as number;
      }
    }
  }
  if (!Object.keys(fields).length) return {fields:{}, warnings:[{code:'unparsed_date',message:'No date/time components were recognized.'}]};

  // Explicit timezone/offset in the value defines the instant and overrides source-zone hints.
  if (explicitInstant?.isValid) {
    if (sourceZone) warnings.push({code:'ignored_zone_hint',message:'Input already contains an absolute instant; source zone hint was not applied.'});
    return {fields, instant:explicitInstant, wall:undefined, zone:embeddedZone, warnings};
  }
  const midnight = fields.hour === undefined && (fields.year !== undefined || fields.month !== undefined || fields.day !== undefined);
  if (fields.year === undefined || fields.month === undefined || fields.day === undefined) {
    // Even incomplete calendar dates may have a known midnight *clock*, without an instant.
    if (midnight) {
      fields = {...fields,hour:0,minute:0,second:0,millisecond:0};
      warnings.push({code:'assumed_midnight',message:'Missing time defaulted to 00:00:00.000.'});
    }
    return {fields, warnings}; // Partial inputs cannot become reliable instants.
  }
  if (midnight) {
    fields = {...fields, hour:0, minute:0, second:0, millisecond:0};
    if (!warnings.some(w => w.code === 'assumed_midnight')) warnings.push({code:'assumed_midnight',message:'Missing time defaulted to 00:00:00.000.'});
  }
  const parts = {
    year:fields.year!, month:fields.month!, day:fields.day!,
    hour:fields.hour ?? 0, minute:fields.minute ?? 0, second:fields.second ?? 0, millisecond:fields.millisecond ?? 0,
  };
  const wall = DateTime.fromObject(parts, {zone:'UTC'});
  if (!wall.isValid) {
    return {fields:{},warnings:[...warnings,{code:'invalid_date',message:wall.invalidExplanation ?? 'Invalid calendar value'}]};
  }
  if (!sourceZone) return {fields,wall,warnings};
  const instant = DateTime.fromObject(parts,{zone:sourceZone});
  if (!instant.isValid) return {fields,wall,warnings:[...warnings,{code:'invalid_zoned_date',message:instant.invalidExplanation ?? 'Invalid source time zone date'}]};
  // Luxon resolves ambiguous DST transitions by policy. Flag so a production implementation can adopt a stricter rule.
  return {fields,instant,wall,zone:sourceZone,warnings};
}

/** Convert naive wall time into a hypothesized instant, only after caller explicitly made an assumption. */
export function assumeZone(normalized:NormalizedTemporal,zone:string):DateTime | undefined {
  if (normalized.instant) return normalized.instant;
  if (!normalized.wall) return undefined;
  const {year,month,day,hour,minute,second,millisecond} = normalized.wall;
  const dt = DateTime.fromObject({year,month,day,hour,minute,second,millisecond},{zone});
  return dt.isValid ? dt : undefined;
}
