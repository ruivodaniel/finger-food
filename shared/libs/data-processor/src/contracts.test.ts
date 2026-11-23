import { describe, expect, it } from 'vitest';
import {processNumber, processText, processDateTime, processDuration, evaluateConditional} from './index';

describe('number API — five mutually exclusive modes', () => {
  it('Full never introduces magnitude abbreviations', () => {
    expect(processNumber({value:'3476543210'},{mode:{kind:'full'},locale:'en-US'}).value).toBe('3,476,543,210');
  });
  it('Compact Max N trims zeros, Compact Fixed N retains them', () => {
    expect(processNumber({value:1000000},{mode:{kind:'compactMax',n:3}})).toMatchObject({value:'1',unit:'M'});
    expect(processNumber({value:1000000},{mode:{kind:'compactFixed',n:3}})).toMatchObject({value:'1.00',unit:'M'});
    expect(processNumber({value:12},{mode:{kind:'compactMax',n:3}}).value).toBe('12');
    expect(processNumber({value:12},{mode:{kind:'compactMax',n:1}}).value).toBe('10');
    expect(processNumber({value:123},{mode:{kind:'compactMax',n:2}}).value).toBe('120');
  });
  it('Fixed Scale N does not cap integer digits', () => {
    expect(processNumber({value:3476543210},{mode:{kind:'fixedScale',scale:'million',n:2}})).toMatchObject({value:'3,476.54',unit:'M'});
  });
  it('Tiny numbers round to zero without negative zero or OVERFLOW',()=>{
    expect(processNumber({value:'-0.000002'},{mode:{kind:'compactMax',n:3}}).value).toBe('0');
  });
  it('Scientific retains an exponent as an independent field', () => {
    expect(processNumber({value:0.000002},{mode:{kind:'scientific',n:3}})).toMatchObject({value:'2.00',exponent:-6});
  });
});

describe('text API',()=>{
  it('supports initialisms',()=>expect(processText({value:'Product Architecture Redesign'},{operation:{kind:'initials'}}).value).toBe('PAR'));
  it('masks without losing length',()=>expect(processText({value:'AB12345XYZ'},{operation:{kind:'mask',keepStart:2,keepEnd:3}}).value).toBe('AB•••••XYZ'));
});

describe('temporal converter shared by date/time + duration',()=>{
  it('returns only requested date fields and preserves locale/casing independence',()=>{
    expect(processDateTime({value:'2026-10-07T09:20:35.123Z'},{locale:'pt-PT',fields:{day:'dd',month:{token:'MMMM',casing:'upper'}}})).toMatchObject({day:'07',month:'OUTUBRO'});
  });
  it('does not invent a source zone when target zone is requested',()=>{
    const out=processDateTime({value:'2026-10-07T09:20:00'},{targetTimeZone:'Europe/Lisbon',fields:{hour:'HH'}});
    expect(out.hour).toBe('09');
    expect(out.warnings.some(w=>w.code==='zone_conversion_skipped')).toBe(true);
  });
  it('treats embedded Z as a known instant',()=>{
    const out=processDateTime({value:'2026-10-07T09:20:00Z'},{targetTimeZone:'Europe/Lisbon',fields:{hour:'HH'}});
    expect(out.hour).toBe('10'); // October 7 is DST in Lisbon
    expect(out.warnings.some(w=>w.code==='zone_conversion_skipped')).toBe(false);
  });
  it('rounds 2h59m to 3h',()=>{
    const out=processDuration({from:{value:'2026-10-07T09:00:00Z'},to:{value:'2026-10-07T11:59:00Z'}},{round:true,smallestUnit:'minutes'});
    expect(out.round).toEqual({value:3,unit:'hours'});
  });
  it('increasing maxParts cannot skip or rewrite preceding parts',()=>{
    const input={from:{value:'2023-10-07T09:20:00Z'},to:{value:'2026-11-07T12:05:35Z'}};
    const base={smallestUnit:'seconds' as const};
    const three=processDuration(input,{...base,maxParts:3}).parts;
    const four=processDuration(input,{...base,maxParts:4}).parts;
    expect(four.slice(0,3)).toEqual(three);
    expect(four.length).toBeGreaterThanOrEqual(three.length);
    expect(four.some(p=>p.unit==='months')).toBe(true);
  });
  it('calendar-aware smart round can output years',()=>{
    const out=processDuration({from:{value:'2023-10-07T09:20:00Z'},to:{value:'2026-11-07T12:05:35Z'}},{round:true});
    expect(out.round).toEqual({value:3,unit:'years'});
  });
});

describe('conditional rules',()=>{
  it('does not associate positive values with success by default',()=>{
    expect(evaluateConditional({value:10},{rules:[{id:'cost-up',when:{operator:'gt',value:0},state:'warning'}]})).toMatchObject({state:'warning',matchedRule:'cost-up'});
  });
});

describe('negative', () => {
  it('writes a minus by default and parentheses when asked', () => {
    expect(processNumber({ value: -1234.5 }, { mode: { kind: 'full' }, locale: 'en-GB' }).value).toBe('−1,234.5');
    expect(processNumber({ value: -1234.5 }, { mode: { kind: 'full' }, locale: 'en-GB', negative: 'parentheses' }).value).toBe('(1,234.5)');
    expect(processNumber({ value: -34000 }, { mode: { kind: 'compactMax', n: 2 }, locale: 'en-GB', negative: 'parentheses' }).value).toBe('(34)');
  });
});

describe('plain', () => {
  it('carries the number with no grouping, the locale decimal and a minus', () => {
    expect(processNumber({ value: -1234567.89 }, { mode: { kind: 'full' }, locale: 'en-GB' }).plain).toBe('-1234567.89');
    expect(processNumber({ value: 1234567.89 }, { mode: { kind: 'full' }, locale: 'pt-BR' }).plain).toBe('1234567,89');
    expect(processNumber({ value: -1234.5 }, { mode: { kind: 'full' }, locale: 'en-GB', negative: 'parentheses' }).plain).toBe('-1234.5');
  });
});
