"""A small sample of the raw tables (10 of each) as fixtures for the page exploration. Re-run to rebuild: python3 fixtures_sample.py <out_dir>"""
import json, os, sys, collections, datetime, random
RAW = os.path.join(os.path.dirname(__file__), "..", "raw")
L = lambda n: [json.loads(l) for l in open(os.path.join(RAW, n + ".jsonl"), encoding="utf-8")]
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
random.seed(4)
inv, lines, pay, quotes = L("invoices"), L("invoice_lines"), L("payments"), L("proposals")
byinv = collections.defaultdict(list)
for l in lines: byinv[l["invoice_id"]].append(l)
D = datetime.date.fromisoformat
def payment_of(i):
    for p in pay:
        if not p["cancelled"] and p["gross"] and abs(p["gross"] - abs(i["gross"] or 0)) < 0.02 and abs((D(p["issue_date"]) - D(i["issue_date"])).days) <= 20: return p
# ---- invoices: 10, with lines, a mix of years, 6 with a payment from the list
cands = [i for i in inv if byinv[i["id"]] and i["gross"]]
paid = [i for i in cands if payment_of(i)]; unpaid = [i for i in cands if not payment_of(i) and i["issue_date"] >= "2025"]
pick = random.sample(paid, 6) + random.sample(unpaid, 4)
invoices = []
for i in sorted(pick, key=lambda x: x["issue_date"]):
    p = payment_of(i)
    invoices.append(dict(id=i["id"], number=i["number"], issue_date=i["issue_date"], due_date=i["due_date"], customer=i["customer_name"], tax_id=i["customer_tax_id"], payment_terms=i["payment_terms"],
        net=i["net"], vat=i["vat"], gross=i["gross"], lines=[dict(description=l["description"], quantity=l["quantity"], unit_price=l["unit_price"], vat_rate=l["vat_rate"], total_gross=l["total_gross"]) for l in byinv[i["id"]]],
        payment=dict(received_date=p["received_date"], list_entity=p["entity"], list_sheet=p["list_sheet"]) if p and p["received_date"] else None, source=i["source"]["name"]))
customers = collections.OrderedDict()
for i in invoices:
    c = customers.setdefault(i["customer"], dict(name=i["customer"], tax_id=i["tax_id"], invoices=[]))
    c["invoices"].append(i["number"])
# ---- payments: 10 rows of the list (the matched ones first)
pays = [dict(id=p["id"], list_sheet=p["list_sheet"], list_code=p["list_code"], entity=p["entity"], issue_date=p["issue_date"], gross=p["gross"], received_date=p["received_date"], cancelled=p["cancelled"]) for p in pay if not p["cancelled"] and p["received_date"]]
sample_pay = pays[:0]
matched_dates = {(i["payment"]["received_date"]) for i in invoices if i["payment"]}
sample_pay = [p for p in pays if p["received_date"] in matched_dates][:10]
sample_pay += [p for p in pays if p not in sample_pay][: 10 - len(sample_pay)]
# ---- quotes: 10 from the agents' files (every moment, menu line, price), rich ones first
BL = os.path.join(RAW, "llm")
qrows = {q["source"]["upload_id"]: q for q in quotes}  # the proposals (Orçamentos)
rich = []
for f in os.listdir(BL):
    d = json.load(open(os.path.join(BL, f), encoding="utf-8"))
    if f[:-5] not in qrows or not d.get("moments") or d.get("total") is None: continue
    items = sum(len(l["items"]) for m in d["moments"] for l in m["menu_lines"])
    rich.append((d, items, qrows[f[:-5]]))
multi = [r for r in rich if len(r[0]["moments"]) >= 2 and r[1] >= 8]; single = [r for r in rich if len(r[0]["moments"]) == 1 and r[1] >= 8]
chosen = random.sample(multi, 6) + random.sample(single, 4)
def qshape(d, items, p):
    dates = [x for x in d["event_dates"] if x.get("month")]
    return dict(id=d["quote_id"], file_name=p["file_name"], client=d["client"], client_source=d.get("client_source"), event_dates=d["event_dates"], place=d.get("place"), total=d["total"], total_includes_vat=d.get("total_includes_vat"),
        staff=d.get("staff_mentioned"), notes=d.get("notes", []), uncertain=d.get("uncertain", []), moments=d["moments"], prices_outside=d.get("prices_not_in_a_moment", []), items=items)
quotes_s = [qshape(*r) for r in chosen]
json.dump(dict(invoices=invoices, customers=list(customers.values()), payments=sample_pay, proposals=quotes_s), open(os.path.join(out, "sample.json"), "w"), ensure_ascii=False, indent=1)
counts = dict(documents=712, customers=len(customers), invoices=len(invoices), invoice_lines=sum(len(i["lines"]) for i in invoices), payments=len(sample_pay), quotes=len(quotes_s), moments=sum(len(q["moments"]) for q in quotes_s),
              menu_lines=sum(len(m["menu_lines"]) for q in quotes_s for m in q["moments"]), menu_items=sum(q["items"] for q in quotes_s), price_lines=sum(len(m["prices"]) for q in quotes_s for m in q["moments"]) + sum(len(q["prices_outside"]) for q in quotes_s))
print(counts)
