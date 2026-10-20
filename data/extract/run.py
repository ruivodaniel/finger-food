"""Run the extraction: registry + converted texts -> data/raw/*.jsonl (and .csv). Safe to re-run: the output is rebuilt from the sources."""
import collections
from common import Registry, write_table
import invoices, quotes, payments

def main():
    reg = Registry()
    docs, inv_rows, line_rows, q_rows, ql_rows, qm_rows, pay_rows = [], [], [], [], [], [], []
    seen = {}
    for folder in invoices.FOLDERS:
        for u in reg.uploads(folder):
            if u["name"].startswith("~$") or u.get("ext", "").lower() != ".pdf": continue
            text = reg.text(u)
            if text is None: docs.append(dict(upload_id=u["id"], name=u["name"], kind="invoice", status="no text", issue="no converted text")); continue
            inv, lines, issue = invoices.parse(u, text, folder.split("/")[-1])
            if inv is None: docs.append(dict(upload_id=u["id"], name=u["name"], kind="other", status="skipped", issue=issue)); continue
            dup = inv["id"] in seen
            docs.append(dict(upload_id=u["id"], name=u["name"], kind="invoice", status="duplicate of " + inv["id"] if dup else ("ok" if not issue else "issue"), issue=issue))
            if dup:
                if len(lines) <= len(seen[inv["id"]][1]): continue
                inv_rows[:] = [r for r in inv_rows if r["id"] != inv["id"]]; line_rows[:] = [r for r in line_rows if r["invoice_id"] != inv["id"]]
            seen[inv["id"]] = (inv, lines); inv_rows.append(inv); line_rows.extend(lines)
    for u in reg.uploads("goncalo/Or"):
        if u["name"].startswith("~$") or u.get("ext", "").lower() not in (".pdf", ".docx"): continue
        text = reg.text(u)
        if text is None: docs.append(dict(upload_id=u["id"], name=u["name"], kind="quote", status="no text", issue="no converted text")); continue
        q, pl, mi = quotes.parse(u, text)
        docs.append(dict(upload_id=u["id"], name=u["name"], kind="quote", status="ok" if not q["issues"] else "issue", issue=", ".join(q["issues"]) or None))
        q_rows.append(q); ql_rows.extend(pl); qm_rows.extend(mi)
    for u in reg.uploads("goncalo/Faturas Emitidas"):
        if u["name"].lower().startswith("lista faturas emitidas") and u.get("ext") == ".xlsx" and not u["name"].startswith("~$"): pay_rows.extend(payments.parse(u))
    out = {"documents": docs, "invoices": inv_rows, "invoice_lines": line_rows, "quotes": q_rows, "quote_lines": ql_rows, "quote_menu_items": qm_rows, "payments": pay_rows}
    for name, rows in out.items(): print(f"{name:18} {write_table(name, rows):>6} rows")
    st = collections.Counter((d["kind"], d["status"].split(" of ")[0]) for d in docs)
    print("documents by status:", dict(st))
    print("quote issues:", collections.Counter(i for q in q_rows for i in q["issues"]))

if __name__ == "__main__": main()
