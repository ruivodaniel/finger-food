"""Builds the data for the cleansing spike: every table (as parsed), the links between them, the menu items and menu lines aggregated, and the Excel products matched to the items. Run: python3 analysis.py <out_dir>"""
import sys, os, re, json, unicodedata, collections, difflib
sys.path.insert(0, os.path.dirname(__file__))
from flatten import load
from price_list import parse as parse_prices
RAW = os.path.join(os.path.dirname(__file__), "..", "raw")
J = lambda n: [json.loads(l) for l in open(os.path.join(RAW, n + ".jsonl"), encoding="utf-8")]
out = sys.argv[1]; os.makedirs(out, exist_ok=True)

def norm(t):
    t = unicodedata.normalize("NFD", (t or "").lower()); t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"\([^)]*\)", " ", t); t = re.sub(r"[^a-z0-9 ]", " ", t); return re.sub(r"\s+", " ", t).strip()
P, M, L, I, R = load()
for i in I: i["norm"] = norm(i["text"])
# ---- near-duplicate clusters of the normalized item names: the most frequent spelling leads
cnt = collections.Counter(i["norm"] for i in I)
names = [n for n, _ in cnt.most_common()]
leader = {}; leaders = []
for n in names:
    if not n: leader[n] = n; continue
    best = None
    for ld in leaders:
        if abs(len(ld) - len(n)) > 6 or ld[0] != n[0] and difflib.SequenceMatcher(None, ld, n).quick_ratio() < .9: continue
        r = difflib.SequenceMatcher(None, ld, n).ratio()
        if r >= .88 and (best is None or r > best[0]): best = (r, ld)
    if best: leader[n] = best[1]
    else: leader[n] = n; leaders.append(n)
for i in I: i["cluster"] = leader[i["norm"]]
# ---- items aggregated (by normalized name, and by cluster)
def agg(key):
    g = collections.defaultdict(lambda: dict(count=0, proposals=set(), spellings=collections.Counter(), segments=collections.Counter()))
    for i in I:
        a = g[i[key]]; a["count"] += 1; a["proposals"].add(i["proposal_id"]); a["spellings"][i["text"]] += 1; a["segments"][i["segment"]] += 1
    return [dict(name=k, count=a["count"], proposals=len(a["proposals"]), spellings=[s for s, _ in a["spellings"].most_common(6)], n_spellings=len(a["spellings"]), segment=a["segments"].most_common(1)[0][0]) for k, a in sorted(g.items(), key=lambda kv: -kv[1]["count"])]
items_by_name, items_by_cluster = agg("norm"), agg("cluster")
# ---- menu lines aggregated: same segment and the same set of items
byline = collections.defaultdict(list)
for i in I: byline[i["menu_line_id"]].append(i["cluster"])
segs = {l["id"]: l["segment"] for l in L}
g = collections.defaultdict(lambda: dict(count=0, proposals=set(), ids=[]))
for lid, its in byline.items():
    k = (segs[lid], tuple(sorted(set(its)))); a = g[k]; a["count"] += 1; a["ids"].append(lid); a["proposals"].add(lid.split(":m")[0])
lines_agg = [dict(segment=k[0], items=list(k[1]), n_items=len(k[1]), count=a["count"], proposals=len(a["proposals"])) for k, a in sorted(g.items(), key=lambda kv: -kv[1]["count"])]
# ---- the Excel products against the items
entries, suppliers, params = parse_prices()
sig = {n: set(n.split()) for n in leaders}
def best_match(text):
    n = norm(text)
    if not n: return None
    best = (0, None)
    for ld in leaders:
        r = difflib.SequenceMatcher(None, n, ld).ratio()
        if set(n.split()) <= set(ld.split()) or set(ld.split()) <= set(n.split()): r = max(r, .86 if len(n) > 3 else 0)
        if r > best[0]: best = (r, ld)
    return best if best[0] >= .8 else None
excel = []
for e in entries:
    t = e["ingredient"] or e["product"]
    m = best_match(t)
    excel.append(dict(id=e["id"], sheet=e["sheet"], row=e["row"], kind=e["kind"], category=e["category"], text=t, product=e["product"], pack_price=e["pack_price"], pack_quantity=e["pack_quantity"], unit_price_written=e["unit_price_written"], has_price=bool(e["pack_price"]),
        matched_item=m[1] if m else None, score=round(m[0], 2) if m else None, item_count=cnt.get(m[1], 0) if m else 0))
for s in suppliers:
    m = best_match(s["product"]); excel.append(dict(id=s["id"], sheet=s["sheet"], row=s["row"], kind="supplier list", category=s["supplier_group"], text=s["product"], product=s["product"], pack_price=s["pack_price"], pack_quantity=s["pack_quantity"], unit_price_written=s["unit_price_written"], has_price=bool(s["pack_price"]),
        matched_item=m[1] if m else None, score=round(m[0], 2) if m else None, item_count=cnt.get(m[1], 0) if m else 0))
# ---- every table as parsed
def table(name, rows, cols=None):
    cols = cols or []
    for r in rows:
        for k in r:
            if k not in cols: cols.append(k)
    flat = [{c: (json.dumps(r.get(c), ensure_ascii=False) if isinstance(r.get(c), (dict, list)) else r.get(c)) for c in cols} for r in rows]
    return dict(columns=cols, rows=flat)
inv, il, pay, docs = J("invoices"), J("invoice_lines"), J("payments"), J("documents")
for i in inv: i["upload_id"] = i["source"]["upload_id"]; i.pop("source")
for p in pay: p.pop("source", None)
tables = {"documents": table("documents", docs), "invoice": table("invoice", inv), "invoice_lines": table("invoice_lines", [{k: v for k, v in x.items() if k != "source"} for x in il]), "payment": table("payment", pay),
  "proposal": table("proposal", P), "moment": table("moment", M), "menu_line": table("menu_line", L), "menu_line_item": table("menu_line_item", I), "price_lines": table("price_lines", R), "price_list": table("price_list", excel)}
fks = [("invoice_lines", "invoice_id", "invoice", "id"), ("invoice", "upload_id", "documents", "upload_id"), ("proposal", "upload_id", "documents", "upload_id"), ("moment", "proposal_id", "proposal", "id"), ("menu_line", "moment_id", "moment", "id"), ("menu_line_item", "menu_line_id", "menu_line", "id"), ("price_lines", "moment_id", "moment", "id")]
json.dump(dict(tables=tables, fks=[dict(table=a, column=b, to=c, to_column=d) for a, b, c, d in fks]), open(os.path.join(out, "tables.json"), "w"), ensure_ascii=False)
json.dump(dict(items_by_name=items_by_name, items_by_cluster=items_by_cluster, lines=lines_agg, totals=dict(occurrences=len(I), proposals=len(P), menu_lines=len(L)), excel_params=params), open(os.path.join(out, "aggregates.json"), "w"), ensure_ascii=False)
m = sum(1 for e in excel if e["matched_item"]); print("tables:", {k: len(v["rows"]) for k, v in tables.items()})
print("distinct item names:", len(items_by_name), "-> after merging near-duplicates:", len(items_by_cluster), "| one-offs:", sum(1 for x in items_by_name if x["count"] == 1), "->", sum(1 for x in items_by_cluster if x["count"] == 1))
print("menu lines:", len(L), "distinct:", len(lines_agg), "once:", sum(1 for x in lines_agg if x["count"] == 1))
print("excel rows:", len(excel), "matched to a proposal item:", m, "| with a price:", sum(1 for e in excel if e["has_price"]), "| priced and matched:", sum(1 for e in excel if e["has_price"] and e["matched_item"]))
