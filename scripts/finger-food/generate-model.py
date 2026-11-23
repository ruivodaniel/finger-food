#!/usr/bin/env python3
"""Writes the Drizzle model of the finger-food slice from its ERD (erd/design.dbml).
Run from the repository root:  python3 scripts/finger-food/generate-model.py
The ERD is canon: edit the DBML, run this, then generate the migration."""
import re, sys, json
SL = 'apps/main/slices/product/finger-food/'
src = open(SL + 'erd/design.dbml', encoding='utf-8').read()

# tables of the seed that the ERD names but does not own
SEED = {'user': ('uomUser', 'text'), 'organization': ('uomOrganization', 'text')}
# the seed's payment slice already has a table called purchase
DB_NAME = {'purchase': 'article_purchase'}
MONEY = {'price', 'amount', 'net', 'vat', 'gross', 'total', 'budget', 'hourly_rate', 'unit_price'}

def camel(s): p = s.split('_'); return p[0] + ''.join(x[:1].upper() + x[1:] for x in p[1:])
def pascal(s): return ''.join(x[:1].upper() + x[1:] for x in s.split('_'))

enums = {m.group(1): m.group(2).split() for m in re.finditer(r'^enum (\w+) \{\n(.*?)\n\}', src, re.S | re.M)}

def settings(raw):
    """[pk, not null, unique, default: x, note: '...'] -> dict"""
    out = {}
    if not raw: return out
    m = re.search(r"note: '((?:[^'\\]|\\.)*)'", raw)
    if m: out['note'] = m.group(1).replace("\\'", "'"); raw = raw.replace(m.group(0), '')
    for part in [p.strip() for p in raw.split(',') if p.strip()]:
        if part.startswith('default:'): out['default'] = part.split(':', 1)[1].strip()
        else: out[part] = True
    return out

tables = []
for m in re.finditer(r'^table (\w+) \{\n(.*?)\n\}', src, re.S | re.M):
    name, body = m.group(1), m.group(2)
    idx = []
    im = re.search(r'\n\s*indexes \{\n(.*?)\n\s*\}', body, re.S)
    if im:
        for line in im.group(1).strip().split('\n'):
            cm = re.match(r'\s*\(?([\w, ]+)\)?(?:\s*\[(.*)\])?', line)
            idx.append(([c.strip() for c in cm.group(1).split(',')], 'unique' in (cm.group(2) or '')))
        body = body.replace(im.group(0), '')
    cols = []
    for line in body.split('\n'):
        line = line.strip()
        if not line: continue
        cm = re.match(r'(\w+) ([\w\[\]]+)(?: \[(.*)\])?$', line)
        if not cm: sys.exit('cannot read: ' + name + ': ' + line)
        cols.append((cm.group(1), cm.group(2), settings(cm.group(3))))
    tables.append((name, cols, idx))
names = {t[0] for t in tables}
refs = {}
for m in re.finditer(r'^ref: (\w+)\.(\w+) [>-] (\w+)\.(\w+)', src, re.M):
    refs[(m.group(1), m.group(2))] = (m.group(3), m.group(4))

# order: a table after the tables it points to
order, done = [], set()
def visit(t):
    if t[0] in done: return
    done.add(t[0])
    for (c, _, _) in t[1]:
        r = refs.get((t[0], c))
        if r and r[0] in names and r[0] != t[0]: visit(next(x for x in tables if x[0] == r[0]))
    order.append(t)
for t in tables: visit(t)

def enum_var(e): return 'ffUnit' if e == 'unit' else camel(e)
def var(t): return 'ff' + pascal(t)

out = ['''/**
 * FINGER FOOD domain schema. GENERATED from erd/design.dbml by scripts/finger-food/generate-model.py: edit the DBML, then run it.
 * Every table also has created_at and updated_at. Money is numeric(12,2), quantities numeric(14,3), VAT and percents numeric(5,2).
 * The ERD's table "purchase" is "article_purchase" in the database: the seed's payment slice already has a table called purchase.
 */

import { uomOrganization, uomUser } from "@modules/user-organization-mgmt/models";
import { type AnyPgColumn, boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
''']
used_enums = {c[1] for t in tables for c in t[1] if c[1] in enums}
for e, vals in enums.items():
    if e in used_enums: out.append(f'export const {enum_var(e)} = pgEnum("{e}", {json.dumps(vals)});')
out.append('''
const stamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
const money = (name: string) => numeric(name, { precision: 12, scale: 2 });
const qty = (name: string) => numeric(name, { precision: 14, scale: 3 });
const pct = (name: string) => numeric(name, { precision: 5, scale: 2 });
''')
def doc(s): return s.replace('*/', '* /')
for name, cols, idx in order:
    lines = []
    tnote = None
    pk_cols = [c for c in cols if c[2].get('pk')]
    for cname, ctype, st in cols:
        if cname == 'id' and st.get('note'): tnote = st['note']
        if ctype == 'uuid': e = f'uuid("{cname}")'
        elif ctype == 'text': e = f'text("{cname}")'
        elif ctype == 'text[]': e = f'text("{cname}").array()'
        elif ctype == 'boolean': e = f'boolean("{cname}")'
        elif ctype == 'integer': e = f'integer("{cname}")'
        elif ctype == 'jsonb': e = f'jsonb("{cname}")'
        elif ctype == 'timestamp': e = f'timestamp("{cname}", {{ withTimezone: true }})'
        elif ctype == 'decimal':
            e = (f'money("{cname}")' if cname in MONEY else f'pct("{cname}")' if cname in ('vat_rate', 'percent') else f'qty("{cname}")')
        elif ctype in enums: e = f'{enum_var(ctype)}("{cname}")'
        else: sys.exit('unknown type ' + ctype)
        if st.get('pk'): e += '.primaryKey()' + ('.defaultRandom()' if ctype == 'uuid' else '')
        if st.get('not null') and not st.get('pk'): e += '.notNull()'
        if 'default' in st:
            d = st['default']
            e += f'.default({json.dumps(d) if ctype == "decimal" else d})'
        if st.get('unique'): e += '.unique()'
        r = refs.get((name, cname))
        if r:
            if r[0] in SEED: e += f'.references(() => {SEED[r[0]][0]}.{camel(r[1])})'
            elif r[0] == name: e += f'.references((): AnyPgColumn => {var(name)}.{camel(r[1])})'
            elif r[0] in names: e += f'.references(() => {var(r[0])}.{camel(r[1])})'
        if st.get('note') and cname != 'id': lines.append(f'  /** {doc(st["note"])} */')
        lines.append(f'  {camel(cname)}: {e},')
    lines.append('  ...stamps(),')
    extra = ''
    if idx:
        parts = []
        for cs, uniq in idx:
            parts.append(f'{"uniqueIndex" if uniq else "index"}("{name}_{"_".join(cs)}{"_unique" if uniq else "_idx"}"[:63]).on({", ".join("t." + camel(c) for c in cs)})'.replace('"[:63]', '"'))
        extra = ', (t) => [' + ', '.join(parts) + ']'
    if tnote: out.append(f'/** {doc(tnote)} */')
    out.append(f'export const {var(name)} = pgTable("{DB_NAME.get(name, name)}", {{\n' + '\n'.join(lines) + f'\n}}{extra});\n')
open(SL + 'api/models/finger-food.model.ts', 'w', encoding='utf-8').write('\n'.join(out))
print('tables', len(order), 'enums', len(used_enums))
