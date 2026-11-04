"""Gonçalo's price spreadsheet (Excel FingerFood PREÇOS.xlsx): category > product > ingredients with the price of a pack. Written as it is, nothing cleaned.
Sheets: Folha1 (the list), Folha3 (the same list with a service cost calculation beside it: not read twice), Folha1 (2) (the miniatures by supplier group)."""
import openpyxl
from common import glob_source, nfc

UPLOAD = "f081e4e7-03db-4785-ab27-1e4d4f52ea9d"
clean = lambda v: nfc(str(v)).strip() if v is not None else None
def num(v): return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None
def err(v): return str(v) if isinstance(v, str) and v.startswith("#") else None

def parse():
    wb = openpyxl.load_workbook(glob_source(UPLOAD), data_only=True)
    entries, suppliers, params = [], [], []
    ws = wb["Folha1"]; cat = prod = None
    for r in ws.iter_rows(min_row=2):
        a, b, c, d, e, f, h, i = [r[k].value if k < len(r) else None for k in (0, 1, 2, 3, 4, 5, 7, 8)]
        if not any(v is not None for v in (a, b, c, d, e, h, i)): continue
        if clean(a): cat = clean(a)
        if clean(b): prod = clean(b)
        ingredient = clean(c)
        note = clean(i) or (clean(h) if isinstance(h, str) else None)
        entries.append(dict(id=f"pl:Folha1:{r[0].row}", sheet="Folha1", row=r[0].row, category=cat, product=prod, ingredient=ingredient,
            kind="ingredient" if ingredient else "product", pack_price=num(d), pack_quantity=num(e), unit_price_written=num(f), unit_price_error=err(f),
            supplier_or_note=note, written_h=(h if not isinstance(h, str) else None), source={"upload_id": UPLOAD, "sheet": "Folha1", "row": r[0].row}))
    ws = wb["Folha1 (2)"]; group = None
    for r in ws.iter_rows(min_row=2):
        a, b, c, d, e, f, g = [r[k].value if k < len(r) else None for k in range(7)]
        if clean(a): group = clean(a)
        if not clean(b): continue
        suppliers.append(dict(id=f"pl:Folha1(2):{r[0].row}", sheet="Folha1 (2)", row=r[0].row, supplier_group=group, product=clean(b), pack_price=num(c), pack_quantity=num(d), unit_price_written=num(e), unit_price_error=err(e),
            quantity_per_service=num(f), cost_per_service=num(g), source={"upload_id": UPLOAD, "sheet": "Folha1 (2)", "row": r[0].row}))
        k, l = r[10].value if len(r) > 10 else None, r[11].value if len(r) > 11 else None
    ws = wb["Folha1 (2)"]
    for r in ws.iter_rows(min_row=2, max_row=40):
        k, l = (r[10].value if len(r) > 10 else None), (r[11].value if len(r) > 11 else None)
        if isinstance(k, str) and k.strip() and l is not None and not isinstance(l, str):
            params.append(dict(id=f"pl:param:{r[0].row}", label=clean(k), value=num(l), sheet="Folha1 (2)", row=r[0].row, source={"upload_id": UPLOAD, "sheet": "Folha1 (2)", "row": r[0].row}))
    return entries, suppliers, params
