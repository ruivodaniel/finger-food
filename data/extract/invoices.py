"""Invoices (Faturas 2023-2026): three Primavera templates, reversed or not. One invoice row + its lines."""
import re
from common import nfc, num

N = r"\d[\d .]*(?:,\d+)?"
FOLDERS = ("goncalo/Faturas Emitidas/Faturas 2023", "goncalo/Faturas Emitidas/Faturas 2024", "goncalo/Faturas Emitidas/Faturas 2025", "goncalo/Faturas Emitidas/Faturas 2026")

def isrev(t): return bool(re.search(r"€\nProdutos e Serviços", t))
def lv(t, label):
    m = re.search(r"\n(" + N + r") €\n" + label + r"\n", t) if isrev(t) else re.search(r"\n" + label + r"\n(" + N + r") €", t)
    return num(m.group(1)) if m else None

def parse(upload, text, folder):
    """-> (invoice row, [line rows], issue) ; issue is None when the document is an invoice we could read."""
    t = text
    m = re.search(r"(Fatura-Recibo|Fatura|Nota de crédito|Nota de débito)\s+(FA|FR|NC|ND)\s+([A-Z]+ ?\d{4}/\d+)", t)
    if not m: return None, [], "no invoice header"
    no, kind, rev = m.group(3).replace(" ", ""), m.group(2), isrev(t)
    if rev:
        after = t[t.index(m.group(0)) + len(m.group(0)):].split("\n"); cust = ""
        for ln in after[:12]:
            if re.search(r"[A-Za-zÀ-ú]{3}", ln) and ln.strip() not in ("2.ª Via", "Original", "Duplicado", "NIF", "Cliente", "Referência", "Moeda", "Data", "EUR", "Condições de Pagamento", "Taxa de Câmbio", "Desconto") and not re.match(r"^(Total|Imp|Des|Preço|Qtd|Artigo)", ln):
                cust = ln.strip(); break
        nif = re.search(r"\n(\w+)\nNIF\n", t); date = re.search(r"(\d\d/\d\d/\d{4})\nData\n", t); due = re.search(r"(\d\d/\d\d/\d{4})\nData de Vencimento", t)
        pay = re.search(r"\n([^\n]+)\nCondições de Pagamento", t)
    else:
        c = re.search(r"ATCUD:[^\n]*\n(.*?)\n" + re.escape(m.group(0)), t, re.S); cust = c.group(1).split("\n")[0].strip() if c else ""
        nif = re.search(r"\nNIF\n(\w+)", t); date = re.search(r"\nData\n(\d\d/\d\d/\d{4})", t); due = re.search(r"Data de Vencimento\n(\d\d/\d\d/\d{4})", t)
        pay = re.search(r"Condições de Pagamento\n(.*?)\nTaxa de Câmbio", t, re.S)
    lines = []
    def add(desc, qty, unit, disc, vat, total): lines.append(dict(description=desc.replace("\n", " ").strip(), quantity=num(qty), unit_price=num(unit), discount_pct=int(disc), vat_rate=int(vat), total_gross=num(total)))
    for it in re.finditer(r"\n(\d{2})\n(.+?)\n([\d.,]+) (UN|[A-Z]+)\n(" + N + r") (\d+)%\n(\d+)%\n(" + N + r")", t, re.S):
        add(it.group(2), it.group(3), it.group(5), it.group(6), it.group(7), it.group(8))
    if not lines:
        for it in re.finditer(r"\n(" + N + r")\n(\d+)%\n(\d+)%\n(" + N + r")\n([A-Z]+)\n([\d.,]+)\n(.+?)\n(\d{2})\n", t, re.S):
            add(it.group(7), it.group(6), it.group(4), it.group(3), it.group(2), it.group(1))
    if not lines:
        for it in re.finditer(r"\n(" + N + r")\n(\d+)%\n(\d+)%\n(" + N + r")\n([\d.,]+)\n(\d{2})\n([^\n]+)", t):
            add(it.group(7), it.group(5), it.group(4), it.group(3), it.group(2), it.group(1))
    net, vat, tot = lv(t, "Líquido"), lv(t, "Imposto"), lv(t, "Total a Pagar") or lv(t, "Total")
    if tot is None and net is not None and vat is not None: tot = net + vat
    sign = -1 if kind == "NC" else 1
    inv = dict(id="inv:" + no, number=no, doc_type=kind, issue_date=_iso(date), due_date=_iso(due), customer_name=nfc(cust), customer_tax_id=nif.group(1) if nif else None,
               payment_terms=(pay.group(1).replace("\n", " ").strip() if pay else None), net=sign * net if net is not None else None, vat=sign * vat if vat is not None else None, gross=sign * tot if tot is not None else None,
               folder=folder, source={"upload_id": upload["id"], "name": nfc(upload["name"]), "template": "reversed" if rev else "normal"})
    rows = [dict(id=f"{inv['id']}:{i + 1}", invoice_id=inv["id"], line_no=i + 1, **l) for i, l in enumerate(lines)]
    issue = None
    if date is None: issue = "no date"
    elif tot is None: issue = "no total"
    return inv, rows, issue

def _iso(m):
    if not m: return None
    d = m.group(1); return f"{d[6:]}-{d[3:5]}-{d[:2]}"
