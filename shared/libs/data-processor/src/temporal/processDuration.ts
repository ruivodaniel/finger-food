import { DateTime } from 'luxon';
import type { DurationConfig, DurationInput, DurationOutput, DurationUnit, UnitPart, Diagnostic } from '../contracts';
import { assumeZone, normalizeTemporal } from './normalize';

const UNITS:DurationUnit[] = ['years','months','weeks','days','hours','minutes','seconds','milliseconds'];
const LABELS:Record<DurationUnit,string> = {
  years:'y', months:'mo', weeks:'w', days:'d', hours:'h', minutes:'m', seconds:'s', milliseconds:'ms'
};
function unitDiff(a:DateTime,b:DateTime,unit:DurationUnit):number {
  return b.diff(a,unit).get(unit);
}
export function processDuration(input:DurationInput,config:DurationConfig = {}):DurationOutput {
  const warnings:Diagnostic[]=[];
  const from = normalizeTemporal(input.from,config.fromSourceTimeZone);
  const to = 'now' in input.to
    ? normalizeTemporal({value:config.now ?? new Date()},undefined)
    : normalizeTemporal(input.to,config.toSourceTimeZone);
  warnings.push(...from.warnings.map(w=>({...w,field:w.field??'from'})), ...to.warnings.map(w=>({...w,field:w.field??'to'})));
  if (!from.wall && !from.instant || !to.wall && !to.instant) {
    return {parts:[],warnings:[...warnings,{code:'incomplete_endpoint',message:'Both endpoints need complete calendar dates to calculate a duration.'}]};
  }
  const aZone = from.zone, bZone = to.zone;
  let a:DateTime|undefined = from.instant;
  let b:DateTime|undefined = to.instant;
  if (!a && bZone) {
    a = assumeZone(from,bZone);
    warnings.push({code:'assumed_source_zone',field:'from',message:`From source had no zone; assumed To source zone (${bZone}).`});
  }
  if (!b && aZone) {
    b = assumeZone(to,aZone);
    warnings.push({code:'assumed_source_zone',field:'to',message:`To source had no zone; assumed From source zone (${aZone}).`});
  }
  if (!a && !b) {
    // UTC below is ONLY a calculation coordinate for two local wall clocks,
    // never a claim that the input was actually UTC.
    a = from.wall;
    b = to.wall;
    warnings.push({code:'assumed_same_unknown_zone',message:'Neither source zone is known. Compared wall clocks as if both are in the same unspecified zone; no time-zone conversion was performed.'});
  }
  if (!a || !b) return {parts:[],warnings:[...warnings,{code:'incomplete_endpoint',message:'Could not resolve both duration endpoints.'}]};
  const bothUnknown = !aZone && !bZone;
  if (bothUnknown && config.calendarTimeZone) {
    warnings.push({code:'calendar_zone_ignored_unknown_sources',message:'Calendar zone was not applied to unzoned wall-clock sources; original clock values were preserved.'});
  }
  const zone = bothUnknown ? 'UTC' : (config.calendarTimeZone ?? a.zoneName ?? 'UTC');
  if (!DateTime.now().setZone(zone).isValid) return {parts:[],warnings:[...warnings,{code:'invalid_calendar_zone',message:`Invalid comparison time zone: ${zone}`}]};
  const aCalendar = a.setZone(zone), bCalendar = b.setZone(zone);
  const signed = bCalendar.toMillis() >= aCalendar.toMillis() ? 1 : -1;
  const start = signed===1 ? aCalendar : bCalendar;
  const end = signed===1 ? bCalendar : aCalendar;
  const requested = UNITS.slice(0, UNITS.indexOf(config.smallestUnit ?? 'milliseconds')+1);
  // Existing Luxon implements calendar-aware decomposition. We only map its units to our API.
  const diff = end.diff(start,requested).toObject() as Partial<Record<DurationUnit,number>>;
  const all:UnitPart[] = requested.map(unit=>({unit,value:diff[unit] ?? 0}));
  // Keep all intermediate units, including months/weeks; never skip based on maxParts.
  const nonzero = all.filter(item=>item.value!==0);
  const max = config.maxParts === undefined ? nonzero.length : Math.max(0,Math.floor(config.maxParts));
  const sign = config.direction==='signed' ? signed : 1;
  const parts = nonzero.slice(0,max).map(item=>({...item,value:item.value*sign}));
  const result:DurationOutput = {parts,warnings};
  if (config.round) {
    // Calendar-aware rounded unit via Luxon diff against actual endpoints.
    for (const unit of UNITS) {
      const rounded = Math.round(Math.abs(unitDiff(start,end,unit)));
      if (rounded >= 1) { result.round = {value: rounded*sign,unit}; break; }
    }
    if (!result.round) result.round = {value:0,unit:config.smallestUnit??'milliseconds'};
  }
  if (config.compose) {
    result.composed = parts.map(p=>`${p.value}${config.compose?.labels?.[p.unit] ?? LABELS[p.unit]}`).join(config.compose.separator ?? ' ');
  }
  return result;
}
