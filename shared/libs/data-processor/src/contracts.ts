/** These are the public contracts. Keep internal parsing metadata out of output. */
export type Diagnostic = {
  code: string;
  message: string;
  field?: string;
};
export type WithWarnings = { warnings: Diagnostic[] };

export type NumberInput = { value: number | string };
export type NumberScale = 'milli' | 'unit' | 'thousand' | 'million' | 'billion' | 'trillion';
export type NumberMode =
  | { kind: 'full' }
  | { kind: 'compactMax'; n: number }
  | { kind: 'compactFixed'; n: number }
  | { kind: 'fixedScale'; scale: NumberScale; n: number }
  | { kind: 'scientific'; n: number; variant?: 'scientific' | 'engineering' };
export type NumberConfig = {
  mode: NumberMode;
  locale?: string; // supplied by host, not inferred from time zone
  grouping?: boolean;
  rounding?: 'nearest' | 'down' | 'up' | 'towardZero' | 'halfEven';
  representation?: { kind: 'absolute' } | { kind: 'percentage'; input: 'fraction' | 'points' };
  /** how a negative is written: a minus sign (default) or accounting parentheses, (1,234) */
  negative?: 'minus' | 'parentheses';
};
export type NumberOutput = WithWarnings & {
  value: string;
  /** the same number with no grouping and the locale's decimal separator only (with a minus when negative): what a copy should put on the clipboard */
  plain: string;
  unit?: string; // K/M/B etc; currency/symbol remains a frontend slot
  exponent?: number; // scientific notation, not a physical unit
};

export type TextInput = { value: string };
export type TextOperation =
  | { kind: 'none' }
  | { kind: 'truncate'; maxCharacters: number; placement: 'start' | 'middle' | 'end'; ellipsis?: string }
  | { kind: 'initials'; maxWords?: number }
  | { kind: 'case'; value: 'upper' | 'lower' | 'title' }
  | { kind: 'mask'; keepStart: number; keepEnd: number; maskCharacter?: string };
export type TextConfig = { operation: TextOperation; locale?: string };
export type TextOutput = WithWarnings & { value: string };

export type SourceTimeZone = string; // IANA, e.g. Europe/Lisbon
export type TemporalInput = {
  value: string | number | Date;
  timeZone?: SourceTimeZone; // runtime; overrides config's sourceTimeZone for naive inputs
};
export type Casing = 'locale' | 'title' | 'upper' | 'lower';
export type TextualToken = { token: string; casing?: Casing };
export type DateTimeFields = {
  day?: 'd' | 'dd';
  month?: 'M' | 'MM' | 'MMM' | 'MMMM' | TextualToken;
  year?: 'yy' | 'yyyy';
  hour?: 'H' | 'HH' | 'h' | 'hh';
  minute?: 'm' | 'mm';
  second?: 's' | 'ss';
  millisecond?: 'S' | 'SS' | 'SSS';
  weekday?: TextualToken; // ccc / cccc
  dayPeriod?: TextualToken; // a
};
export type DateTimeConfig = {
  fields: DateTimeFields;
  locale?: string; // resolved by host application; required for locale-specific names
  sourceTimeZone?: SourceTimeZone;
  targetTimeZone?: SourceTimeZone;
};
export type DateTimeOutput = WithWarnings & Partial<Record<keyof DateTimeFields, string>>;

export type DurationUnit =
  | 'years' | 'months' | 'weeks' | 'days'
  | 'hours' | 'minutes' | 'seconds' | 'milliseconds';
export type UnitPart = { value: number; unit: DurationUnit };
export type DurationInput = {
  from: TemporalInput;
  to: TemporalInput | { now: true };
};
export type DurationConfig = {
  fromSourceTimeZone?: SourceTimeZone;
  toSourceTimeZone?: SourceTimeZone;
  calendarTimeZone?: SourceTimeZone; // optional comparison basis for calendar units
  smallestUnit?: DurationUnit;
  maxParts?: number; // slices OUTPUT only; cannot change decomposition
  direction?: 'absolute' | 'signed';
  round?: boolean;
  compose?: { separator?: string; labels?: Partial<Record<DurationUnit, string>> };
  now?: string; // deterministic clock injection for "to: now"; ISO with zone/offset
};
export type DurationOutput = WithWarnings & {
  parts: UnitPart[];
  round?: UnitPart;
  composed?: string;
};

export type SemanticState = 'success' | 'warning' | 'error' | 'neutral' | 'info' | string;
export type ConditionalInput = { value: string | number | boolean | null };
export type ConditionalRule = {
  id: string;
  when: { operator: 'eq' | 'notEq' | 'gt' | 'gte' | 'lt' | 'lte'; value: string | number | boolean | null };
  state: SemanticState;
};
export type ConditionalConfig = { rules: ConditionalRule[]; fallback?: SemanticState };
export type ConditionalOutput = WithWarnings & { state?: SemanticState; matchedRule?: string };
