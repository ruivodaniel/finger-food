import Decimal from 'decimal.js';
import type { NumberInput, NumberConfig, NumberOutput, NumberScale, Diagnostic } from '../contracts';

const SCALES: Record<NumberScale, { exponent: number; label: string }> = {
  milli: { exponent: -3, label: 'm' }, unit: { exponent: 0, label: '' },
  thousand: { exponent: 3, label: 'K' }, million: { exponent: 6, label: 'M' },
  billion: { exponent: 9, label: 'B' }, trillion: { exponent: 12, label: 'T' },
};
const AUTO_SCALE: NumberScale[] = ['trillion', 'billion', 'million', 'thousand'];
function decimalMode(rounding: NumberConfig['rounding']): Decimal.Rounding {
  switch (rounding) {
    case 'down': return Decimal.ROUND_FLOOR;
    case 'up': return Decimal.ROUND_CEIL;
    case 'towardZero': return Decimal.ROUND_DOWN;
    case 'halfEven': return Decimal.ROUND_HALF_EVEN;
    default: return Decimal.ROUND_HALF_UP;
  }
}
function localeSeparators(locale: string): { decimal: string; grouping: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    decimal: parts.find(p => p.type === 'decimal')?.value ?? '.',
    grouping: parts.find(p => p.type === 'group')?.value ?? ',',
  };
}
function localizedDecimal(text: string, locale: string, grouped: boolean, negative: 'minus' | 'parentheses' = 'minus'): string {
  const {decimal, grouping} = localeSeparators(locale);
  const isNegative = text.startsWith('-');
  const sign = isNegative && negative === 'minus' ? '−' : '';
  const [integer, fraction] = text.replace(/^[+-]/, '').split('.');
  let integral = integer;
  if (grouped) {
    try { integral = new Intl.NumberFormat(locale, {maximumFractionDigits: 0}).format(BigInt(integer)); }
    catch { integral = integer.replace(/\B(?=(\d{3})+(?!\d))/g, grouping); }
  }
  const body = sign + integral + (fraction !== undefined ? decimal + fraction : '');
  return isNegative && negative === 'parentheses' ? `(${body})` : body;
}
function digitsLeft(x: Decimal): number {
  if (x.isZero()) return 1;
  if (x.abs().lessThan(1)) return 0;
  return x.abs().floor().toFixed(0).replace(/^0/, '').length;
}
function plainFixed(x: Decimal, places: number, mode: Decimal.Rounding): string {
  const out = x.toFixed(places, mode);
  return new Decimal(out).isZero() && out.startsWith('-') ? out.slice(1) : out;
}
function trailingTrim(s: string): string {
  return s.includes('.') ? s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') : s;
}
function autoScale(x: Decimal): NumberScale {
  const abs = x.abs();
  return AUTO_SCALE.find(k => abs.greaterThanOrEqualTo(new Decimal(10).pow(SCALES[k].exponent))) ?? 'unit';
}
function boundedN(n: number): number { if (!Number.isInteger(n) || n < 1 || n > 16) throw new RangeError('n must be an integer between 1 and 16'); return n; }

/** Process one value; no theme, tooltip, CSS, or raw/display wrapper. */
export function processNumber(input: NumberInput, config: NumberConfig): NumberOutput {
  const warnings: Diagnostic[] = [];
  const locale = config.locale ?? 'en-US';
  const rounding = decimalMode(config.rounding);
  let x: Decimal;
  try {
    x = new Decimal(input.value);
    if (!x.isFinite()) throw new Error('not finite');
  } catch {
    return {value: '', plain: '', warnings: [{code: 'invalid_number', message: 'Expected a finite decimal number.'}]};
  }
  let unit: string | undefined;
  let exponent: number | undefined;
  if (config.representation?.kind === 'percentage') {
    if (config.representation.input === 'fraction') x = x.times(100);
    unit = '%'; // semantic part; frontend controls symbol placement
  }
  let value: string;
  switch (config.mode.kind) {
    case 'full':
      value = x.toFixed(); // decimal.js preserves digits provided as a string
      break;
    case 'compactMax':
    case 'compactFixed': {
      const n = boundedN(config.mode.n);
      const scale = autoScale(x);
      const scaled = x.div(new Decimal(10).pow(SCALES[scale].exponent));
      // Significant digits must also round integer positions (12 -> 10 when N=1).
      const significant = scaled.toSignificantDigits(n,rounding);
      let places = Math.max(0, n - digitsLeft(significant));
      // Approved compact policy: avoid long fractional tails for unscaled numbers.
      if (scale === 'unit') places = Math.min(places, 2);
      const rounded = plainFixed(significant, places, rounding);
      value = config.mode.kind === 'compactMax' ? trailingTrim(rounded) : rounded;
      if (SCALES[scale].label) unit = SCALES[scale].label + (unit ?? '');
      // Carry when rounding crosses a magnitude boundary (999.9K -> 1M).
      const scaleOrder: NumberScale[] = ['unit','thousand','million','billion','trillion'];
      const next = scaleOrder[scaleOrder.indexOf(scale)+1];
      if (next && new Decimal(value).abs().greaterThanOrEqualTo(1000)) {
        const y = x.div(new Decimal(10).pow(SCALES[next].exponent)).toSignificantDigits(n,rounding);
        const p = Math.max(0, n - digitsLeft(y));
        value = plainFixed(y,p,rounding);
        if (config.mode.kind === 'compactMax') value = trailingTrim(value);
        unit = SCALES[next].label + (config.representation?.kind==='percentage' ? '%' : '');
      }
      break;
    }
    case 'fixedScale': {
      const n = config.mode.n;
      if (!Number.isInteger(n) || n < 0 || n > 16) throw new RangeError('Fixed scale n must be between 0 and 16');
      const scale = SCALES[config.mode.scale];
      value = plainFixed(x.div(new Decimal(10).pow(scale.exponent)), n, rounding);
      if (scale.label) unit = scale.label + (unit ?? '');
      break;
    }
    case 'scientific': {
      const n = boundedN(config.mode.n);
      if (x.isZero()) { value = n === 1 ? '0' : '0.' + '0'.repeat(n - 1); exponent = 0; break; }
      let e = Math.floor(x.abs().logarithm(10).toNumber());
      if ((config.mode.variant ?? 'scientific') === 'engineering') e = Math.floor(e / 3) * 3;
      const mantissa = x.div(new Decimal(10).pow(e));
      const significantPlaces = Math.max(0, n - digitsLeft(mantissa));
      value = plainFixed(mantissa, significantPlaces, rounding);
      if (new Decimal(value).abs().greaterThanOrEqualTo((config.mode.variant ?? 'scientific') === 'engineering' ? 1000 : 10)) {
        e += (config.mode.variant ?? 'scientific') === 'engineering' ? 3 : 1;
        value = plainFixed(x.div(new Decimal(10).pow(e)), Math.max(0, n - digitsLeft(x.div(new Decimal(10).pow(e)))), rounding);
      }
      exponent = e;
      break;
    }
  }
  if (value.startsWith('-') && new Decimal(value).isZero()) value = value.slice(1);
  return {
    value: localizedDecimal(value, locale, config.grouping ?? (config.mode.kind === 'full' || config.mode.kind === 'fixedScale'), config.negative),
    plain: localizedDecimal(value, locale, false, 'minus').replace('−', '-'),   // a hyphen-minus: what a spreadsheet parses
    ...(unit ? {unit} : {}),
    ...(exponent !== undefined ? {exponent} : {}), warnings,
  };
}
