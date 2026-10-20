"""Gonçalo's list of issued invoices (Lista Faturas Emitidas *.xlsx): the only source with the date each invoice was received."""
import datetime, openpyxl
from common import glob_source, nfc

def parse(upload):
    wb = openpyxl.load_workbook(glob_source(upload["id"]), data_only=True)
    rows = []
    for sheet in wb:
        if not sheet.title.lower().startswith(("fac. emitidas", "fac emitidas", "fac anuladas")): continue
        cancelled = "anuladas" in sheet.title.lower()
        for n, r in enumerate(sheet.iter_rows(values_only=True), 1):
            if not isinstance(r[4], datetime.datetime) or not isinstance(r[5], (int, float)): continue
            paid = r[8] if isinstance(r[8], datetime.datetime) else None
            rows.append(dict(id=f"pay:{upload['id'][:8]}:{sheet.title}:{n}", list_sheet=sheet.title, list_code=r[2], entity=nfc(str(r[3] or "")).strip(), issue_date=r[4].date().isoformat(), net=r[5], vat=r[6], gross=r[7],
                             received_date=paid.date().isoformat() if paid else None, note=r[8] if isinstance(r[8], str) else None, cancelled=cancelled, source={"upload_id": upload["id"], "name": nfc(upload["name"]), "sheet": sheet.title, "row": n}))
    return rows
