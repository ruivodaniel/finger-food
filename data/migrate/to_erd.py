"""SUPERSEDED (2026-10-21). This pass wrote every menu line name of the history as an `item`. The ERD has since changed: an `item` is now a
`component` (the atom, as it is bought) and the names of the history are `menu items` (menu line templates), reviewed by hand in the slice-design
exploration data-cleansing (components.json, menu-items.json). The history will be migrated again from that review: a line that matches a menu item
is copied from the template (menu_line + menu_line_component), the rest goes to proposal_ad_hoc_line. The outputs in data/erd that this script wrote
(item, item_category, menu_line_item, default_variable by segment) do not fit the ERD any more and are not to be loaded. Kept for the parsers it holds.

"""History -> the canonical ERD, deterministic. Reads data/raw (invoices, payments) and data/raw/llm (one JSON per proposal); writes data/erd/<table>.jsonl.
Nothing is invented: what the history does not say is left null, and rows that the ERD would refuse (a required value is missing) are flagged in `_note`.
Defaults taken here, all listed in the README of this folder: proposal state "sent", event stage "lead" (or invoiced / paid for an invoice's event), the year 2026 for a proposal date written without a year (the
folder holds the proposals of 2026), unit g for main dishes and piece for everything else, quantity from the default variables (4 pieces per guest, shared by the miniatures of a moment)."""
import json, os, re, glob, uuid, unicodedata, datetime, collections
HERE = os.path.dirname(__file__); RAW = os.path.join(HERE, "..", "raw"); OUT = os.path.join(HERE, "..", "erd"); os.makedirs(OUT, exist_ok=True)
NS = uuid.UUID("0b7c1e44-3a6d-4f1b-9c52-8d1f6a2e7b90"); U = lambda *k: str(uuid.uuid5(NS, "|".join(map(str, k))))
L = lambda n: [json.loads(l) for l in open(os.path.join(RAW, n + ".jsonl"), encoding="utf-8")]
norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", str(s).lower()).encode("ascii", "ignore").decode())
tables = collections.defaultdict(list); flags = collections.Counter()
def add(t, row, note=None):
    if note: row["_note"] = note; flags[t + ": " + note.split(";")[0]] += 1
    tables[t].append(row); return row["id"]
ORG, CC = U("organization", "finger-food"), U("catering_company", "finger-food")
add("organization", dict(id=ORG, type="company", name="Finger Food"))
add("catering_company", dict(id=CC, organization_id=ORG))
CAT = add("item_category", dict(id=U("category", "prepared food"), catering_company_id=CC, name="Prepared food", parent_id=None))
# ---------------- categories of drinks and the default variables (the numbers are assumptions to iterate on)
BEV = add("item_category", dict(id=U("category", "beverages"), catering_company_id=CC, name="Beverages", parent_id=None))
DRINKS = [("water", "Water", ("agua", "water"), 0.5), ("juice", "Juice", ("sumo", "juice", "compal"), 0.25), ("soft", "Soft drink", ("coca", "sumol", "refrigerante", "fanta", "sprite"), 0.25), ("sparkling", "Sparkling wine", ("espumante", "champanhe", "prosecco"), 0.1),
          ("wine", "Wine", ("vinho",), 0.2), ("beer", "Beer", ("cerveja", "sagres", "super bock"), 0.33), ("coffee", "Coffee", ("cafe", "descafeinado"), 0.1), ("tea", "Tea", ("cha ", "chas", "infus", "tea"), 0.1), ("other", "Other drink", (), 0.25)]
DCAT = {k: add("item_category", dict(id=U("category", k), catering_company_id=CC, name=n, parent_id=BEV)) for k, n, _, _ in DRINKS}
DLITRES = {k: lit for k, _, _, lit in DRINKS}
def drink_kind(text):
    t = " " + norm_words(text) + " "
    for k, _, kws, _ in DRINKS:
        if any(w in t for w in kws): return k
    return "other"
def norm_words(s): return unicodedata.normalize("NFD", str(s).lower()).encode("ascii", "ignore").decode()
for seg, qty, unit in (("savory_miniature", 4, "piece"), ("sweet_miniature", 4, "piece"), ("main_dish", 300, "g")):
    add("default_variable", dict(id=U("default", seg), catering_company_id=CC, segment=seg, item_category_id=None, quantity=qty, unit=unit), "assumed default, to iterate on")
for k, n, _, lit in DRINKS: add("default_variable", dict(id=U("default", "drink", k), catering_company_id=CC, segment="drink", item_category_id=DCAT[k], quantity=lit, unit="l"), "assumed default, to iterate on")
# ---------------- clients: the invoices' customers first (they carry the tax id), then the proposals' client names
def kind_of(tax): return "individual" if tax and tax[0] in "123" else "company"
clients = {}
def client(name, tax=None):
    k = norm(name)
    if not k: return None
    if k not in clients:
        clients[k] = add("client", dict(id=U("client", k), catering_company_id=CC, name=name.strip(), kind=kind_of(tax) if tax else "individual", tax_id=tax), None if tax else "kind not in the history; set to individual")
    return clients[k]
invoices = L("invoices")
for i in invoices: client(i["customer_name"], i["customer_tax_id"])
# ---------------- invoices: one event per invoice (the history does not link an invoice to a proposal), its payment from Gonçalo's list
pays = [p for p in L("payments") if not p["cancelled"] and p["gross"]]
D = datetime.date.fromisoformat
def payment_of(i):
    for p in pays:
        if abs(p["gross"] - abs(i["gross"] or 0)) < 0.02 and abs((D(p["issue_date"]) - D(i["issue_date"])).days) <= 20 and p["received_date"]: return p
for i in invoices:
    if i["doc_type"] == "NC": add("credit_note_unmapped", dict(id=U("nc", i["number"]), number=i["number"], customer=i["customer_name"], total=i["gross"]), "credit note: the history does not say which invoice it corrects"); continue
    p = payment_of(i); ev = U("event-of-invoice", i["number"])
    add("event", dict(id=ev, client_id=client(i["customer_name"], i["customer_tax_id"]), starts_at=None, ends_at=None, place=None, budget=None, stage="paid" if p else "invoiced"), "event dates unknown: only the invoice date is known (%s)" % i["issue_date"])
    inv = U("invoice", i["number"])
    add("invoice", dict(id=inv, event_id=ev, number=i["number"], issued_at=i["issue_date"], due_at=i["due_date"], payment_terms=i["payment_terms"], net=i["net"], vat=i["vat"], total=i["gross"], cancelled_at=None))
    if p: add("payment", dict(id=U("payment", i["number"]), invoice_id=inv, received_at=p["received_date"], amount=p["gross"]))
# ---------------- proposals: the agents' JSON, one per distinct proposal
SEG = {"savory_miniatures": "savory_miniature", "sweet_miniatures": "sweet_miniature", "starter": "starter", "main_dish": "main_dish", "dessert": "dessert", "drink": "drink"}
SERVICE = {"coffee_break", "lunch", "dinner"}
dups = json.load(open(os.path.join(HERE, "..", "extract", "agents", "duplicates.json")))
shards = [s for f in sorted(glob.glob(os.path.join(HERE, "..", "extract", "agents", "shard-[0-9]*.json"))) for s in json.load(open(f))]
items = {}
def stamp(ev, hh=None):
    y = ev.get("year") or 2026; m, d = ev.get("month"), ev.get("day")
    if not (m and d): return None
    try: return datetime.datetime(y, m, d, *(hh or (0, 0))).isoformat()
    except ValueError: return None   # a day, month or hour that is not a real one
for s in shards:
    a = json.load(open(s["out"], encoding="utf-8")); pid = U("proposal", a["quote_id"]); evid = U("event-of-proposal", a["quote_id"])
    dates = [d for d in a["event_dates"] if d.get("day") and d.get("month")]
    cl = client(a["client"]) if a["client"] else None
    moments = []
    for mi, m in enumerate(a["moments"]):
        hh = re.search(r"(\d{1,2})h(\d{2})?", m["name_as_written"] or ""); hm = (int(hh.group(1)), int(hh.group(2) or 0)) if hh else None
        dm = dates[0] if len(dates) == 1 else next((d for d in dates if re.search(r"\bdia\s*" + str(d["day"]) + r"\b", (m["name_as_written"] or "").lower())), None)
        moments.append((mi, m, stamp(dm, hm) if dm else None, dm))
    starts = [t for _, _, t, _ in moments if t]
    add("event", dict(id=evid, client_id=cl, starts_at=min(starts) if starts else None, ends_at=max(starts) if starts else None, place=a.get("place"), budget=None, stage="lead"),
        None if (starts and cl) else "; ".join(x for x in ("event dates unknown" if not starts else "", "client not written" if not cl else "") if x))
    add("proposal", dict(id=pid, event_id=evid, number=1, sent_at=None, state="sent"), "state not in the history; set to sent")
    for mi, m, t, dm in moments:
        mid = U("moment", a["quote_id"], mi); notes = [x for x in ("start date unknown" if not t else "", "end not in the history", "guests not written" if m["guests"] is None else "", "service type %s is not in the enum" % m["service_type"] if m["service_type"] not in SERVICE else "") if x]
        add("moment", dict(id=mid, proposal_id=pid, service_type=m["service_type"] if m["service_type"] in SERVICE else None, units_per_guest=None, starts_at=t, ends_at=None, guests=m["guests"], position=mi), "; ".join(notes))
        mini = [it for l in m["menu_lines"] if l["segment"] in ("savory_miniatures", "sweet_miniatures") for it in l["items"]]
        for li, l in enumerate(m["menu_lines"]):
            if l["segment"] not in SEG: add("menu_line_unmapped", dict(id=U("line", a["quote_id"], mi, li), moment_id=mid, segment=l["segment"], items=[x["text"] for x in l["items"]]), "segment %s is not in the enum" % l["segment"]); continue
            ml = U("menu_line", a["quote_id"], mi, li); add("menu_line", dict(id=ml, moment_id=mid, segment=SEG[l["segment"]], position=li))
            for ii, it in enumerate(l["items"]):
                k = norm(re.sub(r"\(.*?\)", "", it["text"]))
                dk = drink_kind(it["text"]) if l["segment"] == "drink" else None
                if k not in items: items[k] = add("item", dict(id=U("item", k), name=it["text"].strip(), category_id=DCAT[dk] if dk else CAT, unit="l" if dk else ("g" if l["segment"] == "main_dish" else "piece"), price=None, vat_rate=None, reusable=None), "category and unit not in the history; defaults")
                if it.get("quantity"): q, src = it["quantity"], "written"
                elif l["segment"] in ("savory_miniatures", "sweet_miniatures") and m["guests"] and mini: q, src = round(4 * m["guests"] / len(mini), 2), "default variable: 4 per guest shared by the miniatures of the moment"
                elif dk and m["guests"]: q, src = round(DLITRES[dk] * m["guests"], 2), "default variable: %s l per guest for %s" % (DLITRES[dk], dk)
                else: q, src = None, None
                add("menu_line_item", dict(id=U("mli", a["quote_id"], mi, li, ii), menu_line_id=ml, item_id=items[k], quantity=q, price=None, vat_rate=None), None if q is not None else "quantity not in the history")
                if src and src != "written": tables["menu_line_item"][-1]["_source"] = src
    lines = [(p, mi) for mi, m in enumerate(a["moments"]) for p in m["prices"]] + [(p, None) for p in a.get("prices_not_in_a_moment", [])]
    for pi, (p, mi) in enumerate(lines):
        miss = [k for k in ("quantity", "unit_price", "vat_rate") if p.get(k) is None]
        add("proposal_ad_hoc_line" if not miss else "proposal_ad_hoc_line_incomplete", dict(id=U("adhoc", a["quote_id"], pi), proposal_id=pid, description=p["label"], quantity=p.get("quantity"), price=p.get("unit_price"), vat_rate=p.get("vat_rate"), position=pi), None if not miss else "missing: " + ",".join(miss))
for t, rows in tables.items():
    with open(os.path.join(OUT, t + ".jsonl"), "w", encoding="utf-8") as f:
        for r in rows: f.write(json.dumps(r, ensure_ascii=False) + "\n")
print({t: len(r) for t, r in sorted(tables.items())}); print(dict(flags.most_common(20)))
