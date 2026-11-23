// Simple formulas, spreadsheet style: a cell whose text starts with "=" is computed. Numbers, + - * / and parentheses, a cell like B3, a range like A1:A9 inside a function,
// and SUM, AVG, MIN, MAX, COUNT. Nothing else: no text functions, no lookups. An error is the cell showing #ERR, a loop #LOOP.
export type CellLookup = (col: number, row: number) => number | string | null | undefined;   // 0-based column and row, as the table lays them out
export const ERR = "#ERR", LOOP = "#LOOP";

export const letterOf = (i: number): string => { let n = i, s = ""; do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0); return s; };
export const indexOfLetters = (s: string): number => [...s].reduce((n, c) => n * 26 + (c.charCodeAt(0) - 64), 0) - 1;

type Tok = { t: "num"; v: number } | { t: "ref"; col: number; row: number } | { t: "name"; v: string } | { t: "op"; v: string };
function tokens(src: string): Tok[] | null {
  const out: Tok[] = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " ") { i++; continue; }
    const num = /^\d+(\.\d+)?/.exec(src.slice(i)); if (num) { out.push({ t: "num", v: Number(num[0]) }); i += num[0].length; continue; }
    const ref = /^([A-Za-z]+)(\d+)/.exec(src.slice(i));
    if (ref) { out.push({ t: "ref", col: indexOfLetters(ref[1].toUpperCase()), row: Number(ref[2]) - 1 }); i += ref[0].length; continue; }
    const name = /^[A-Za-z]+/.exec(src.slice(i)); if (name) { out.push({ t: "name", v: name[0].toUpperCase() }); i += name[0].length; continue; }
    if ("+-*/(),:".includes(c)) { out.push({ t: "op", v: c }); i++; continue; }
    return null;
  }
  return out;
}

/** the value of a formula text ("=A1+B1"), or an error text; `lookup` gives a cell's raw content, `depth` stops loops */
export function evaluate(text: string, lookup: CellLookup, depth = 0): number | string {
  if (depth > 20) return LOOP;
  const toks = tokens(text.slice(1)); if (!toks) return ERR;
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  const cell = (col: number, row: number): number | string => {
    const raw = lookup(col, row);
    if (raw === null || raw === undefined || raw === "") return 0;
    if (typeof raw === "string" && raw.startsWith("=")) { const v = evaluate(raw, lookup, depth + 1); return v; }
    const n = Number(raw); return Number.isNaN(n) ? ERR : n;
  };
  const list = (): (number | string)[] | string => {   // the arguments of a function: numbers, cells, ranges
    const vals: (number | string)[] = [];
    for (;;) {
      const t = peek();
      if (t?.t === "ref") {
        next();
        if (peek()?.t === "op" && (peek() as { v: string }).v === ":") {
          next(); const e = next(); if (e?.t !== "ref") return ERR;
          for (let r = Math.min(t.row, e.row); r <= Math.max(t.row, e.row); r++) for (let c = Math.min(t.col, e.col); c <= Math.max(t.col, e.col); c++) vals.push(cell(c, r));
        } else vals.push(cell(t.col, t.row));
      } else { const v = expr(); if (typeof v === "string") return v; vals.push(v); }
      if (peek()?.t === "op" && (peek() as { v: string }).v === ",") { next(); continue; }
      return vals;
    }
  };
  const primary = (): number | string => {
    const t = next();
    if (!t) return ERR;
    if (t.t === "num") return t.v;
    if (t.t === "ref") return cell(t.col, t.row);
    if (t.t === "op" && t.v === "-") { const v = primary(); return typeof v === "number" ? -v : v; }
    if (t.t === "op" && t.v === "(") { const v = expr(); const c = next(); return c?.t === "op" && c.v === ")" ? v : ERR; }
    if (t.t === "name") {
      const o = next(); if (!(o?.t === "op" && o.v === "(")) return ERR;
      const vals = list(); if (typeof vals === "string") return vals;
      const c = next(); if (!(c?.t === "op" && c.v === ")")) return ERR;
      const bad = vals.find((v) => typeof v === "string"); if (bad !== undefined) return bad;
      const nums = vals as number[];
      switch (t.v) {
        case "SUM": return nums.reduce((a, b) => a + b, 0);
        case "AVG": return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        case "MIN": return nums.length ? Math.min(...nums) : 0;
        case "MAX": return nums.length ? Math.max(...nums) : 0;
        case "COUNT": return nums.length;
        default: return ERR;
      }
    }
    return ERR;
  };
  const term = (): number | string => {
    let a = primary();
    for (;;) {
      const o = peek(); if (!(o?.t === "op" && (o.v === "*" || o.v === "/"))) return a;
      next(); const b = primary();
      if (typeof a === "string") return a; if (typeof b === "string") return b;
      a = o.v === "*" ? a * b : b === 0 ? ERR : a / b;
    }
  };
  const expr = (): number | string => {
    let a = term();
    for (;;) {
      const o = peek(); if (!(o?.t === "op" && (o.v === "+" || o.v === "-"))) return a;
      next(); const b = term();
      if (typeof a === "string") return a; if (typeof b === "string") return b;
      a = o.v === "+" ? a + b : a - b;
    }
  };
  const v = expr();
  return p < toks.length ? ERR : v;
}
