import { DateTime } from 'luxon';
import type { DateTimeConfig, DateTimeOutput, Casing, TextualToken, Diagnostic, TemporalInput } from '../contracts';
import { normalizeTemporal } from './normalize';
function caseWord(value: string, casing: Casing | undefined, locale:string):string {
  if (casing === 'upper') return value.toLocaleUpperCase(locale);
  if (casing === 'lower') return value.toLocaleLowerCase(locale);
  if (casing === 'title') return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
  return value;
}
function tokenInfo(value: string | TextualToken):TextualToken { return typeof value === 'string' ? {token:value} : value; }
const pad = (n:number,w:number) => String(n).padStart(w,'0');
const monthName = (month:number, width: 'short'|'long', locale:string) =>
  // Locale decides language; clean trailing abbreviation dot by explicit product decision.
  new Intl.DateTimeFormat(locale,{month:width,timeZone:'UTC'}).format(new Date(Date.UTC(2020,month-1,1))).replace(/\.$/, '');
export function processDateTime(input:TemporalInput,config:DateTimeConfig):DateTimeOutput {
  const locale = config.locale ?? 'en-US';
  const normalized = normalizeTemporal(input,config.sourceTimeZone,locale);
  const warnings: Diagnostic[] = [...normalized.warnings];
  let fields = normalized.fields;
  if (config.targetTimeZone) {
    if (!DateTime.now().setZone(config.targetTimeZone).isValid) {
      warnings.push({code:'invalid_target_zone',message:`Invalid target time zone: ${config.targetTimeZone}`});
    } else if (normalized.instant) {
      const adjusted = normalized.instant.setZone(config.targetTimeZone);
      fields = {year:adjusted.year,month:adjusted.month,day:adjusted.day,
        hour:adjusted.hour,minute:adjusted.minute,second:adjusted.second,millisecond:adjusted.millisecond};
    } else {
      warnings.push({code:'zone_conversion_skipped',message:'Target zone requested but source instant/zone is unknown. Preserving extracted wall-clock fields.'});
    }
  }
  const result:DateTimeOutput = {warnings};
  const fail = (field:string) => warnings.push({code:'missing_field',field,message:`Cannot extract requested ${field} from the input.`});
  const get = (field:keyof typeof fields):number|undefined => fields[field];
  for (const [field, spec] of Object.entries(config.fields)) {
    if (!spec) continue;
    const {token,casing} = tokenInfo(spec);
    let value: string | undefined;
    switch (field) {
      case 'day': if (get('day') !== undefined) value = token==='dd' ? pad(get('day')!,2) : String(get('day')); break;
      case 'month': if (get('month') !== undefined) {
        const m = get('month')!;
        value = token === 'M' ? String(m) : token === 'MM' ? pad(m,2)
          : token === 'MMM' ? caseWord(monthName(m,'short',locale),casing,locale)
          : caseWord(monthName(m,'long',locale),casing,locale);
      } break;
      case 'year': if (get('year') !== undefined) value = token==='yy' ? pad(get('year')!%100,2) : pad(get('year')!,4); break;
      case 'hour': if (get('hour') !== undefined) {
        const h = token==='h' || token==='hh' ? (get('hour')!%12||12) : get('hour')!;
        value = token === 'hh' || token === 'HH' ? pad(h,2) : String(h);
      } break;
      case 'minute': if (get('minute') !== undefined) value = token==='mm' ? pad(get('minute')!,2) : String(get('minute')); break;
      case 'second': if (get('second') !== undefined) value = token==='ss' ? pad(get('second')!,2) : String(get('second')); break;
      case 'millisecond': if (get('millisecond') !== undefined) value = pad(get('millisecond')!,3).slice(0,token.length); break;
      case 'weekday': if (get('year')!==undefined && get('month')!==undefined && get('day')!==undefined) {
        const d = new Date(Date.UTC(get('year')!,get('month')!-1,get('day')!));
        value = new Intl.DateTimeFormat(locale,{weekday:token==='cccc'?'long':'short',timeZone:'UTC'}).format(d);
        value = caseWord(value,casing,locale);
      } break;
      case 'dayPeriod': if (get('hour') !== undefined) {
        value = new Intl.DateTimeFormat(locale,{hour:'numeric',hour12:true,timeZone:'UTC'}).formatToParts(new Date(Date.UTC(2020,0,1,get('hour')!))).find(x=>x.type==='dayPeriod')?.value;
        value = value ? caseWord(value,casing,locale) : undefined;
      } break;
    }
    if (value === undefined) fail(field); else (result as Record<string,unknown>)[field] = value;
  }
  return result;
}
