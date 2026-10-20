"""Quotes (Orçamentos): free text from Word and PDF. One quote row, its price lines and its menu items, as written."""
import re
from common import nfc, num

MONTHS = {"janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3, "abril": 4, "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12}
SECTIONS = [  # (regex, section name) — a heading line starts a section of menu items
    (r"^miniaturas salgadas", "savory_miniatures"), (r"^miniaturas doces", "sweet_miniatures"), (r"^entradas?\b", "starters"),
    (r"^prato principal|^pratos principais|^prato quente", "main_dishes"), (r"^sobremesas?\b", "desserts"), (r"^menu de (almo[çc]o|jantar)", "menu"),
    (r"^comidas?:?$", "food"), (r"^(mesa de )?bebidas", "drinks"), (r"^decora[çc][ãa]o", "decoration"), (r"^pre[çc]os?\b", "prices"), (r"^buffet", "food"), (r"^sopa|^salada", None),
]
SKIP = re.compile(r"fingerfood|@|^\+?\d[\d ]{8,}|nos servi[çc]os apresentados|demonstrando|disponibilizo|para os servi[çc]os|material necess|atoalhados|^cliente:|^data:|^servi[çc]o:|^convidados:|^n\.? pessoas|^pax|^local:|^pág|^\d+ ?/ ?\d+$|^total|^sub ?total|iva|acresce|^\(?levar|^obs", re.I)
PRICE_LINE = re.compile(r"^(?P<label>.*?)\s*[-–:]?\s*(?P<unit>\d+(?:[.,]\d+)?)\s*€?\s*[x×]\s*(?P<qty>\d+(?:[.,]\d+)?)\s*(?:=\s*(?P<total>\d+(?:[.,]\d+)?)\s*€?)?\s*(?P<rest>.*)$", re.I)

_DAYS = r"(\d{1,2})(?:\s*(?:,|e|a|-|\+)\s*\d{1,2})*"
_MON = "|".join(sorted(MONTHS, key=len, reverse=True))
DATE_RX = re.compile(r"(?:" + _DAYS + r"\s*(?:de\s+)?)?\b(" + _MON + r")\b(?:\s*(?:de\s*)?(20\d\d))?", re.I)

def _date(text, name):
    """First 'day(s) month [year]' in the header, else in the file name. Day or year stay None when not written."""
    for src in (text[:600], name):
        for m in DATE_RX.finditer(src):
            if m.group(1) or m.group(3) or src is name:
                mon = MONTHS[m.group(2).lower()]
                return m.group(0).strip(), int(m.group(1)) if m.group(1) else None, mon, int(m.group(3)) if m.group(3) else None
    return None, None, None, None

def parse(upload, text):
    name, t = nfc(upload["name"]), text
    head = lambda label: (re.search(r"^" + label + r"\s*:\s*(.+)$", t, re.M | re.I) or [None, None])[1]
    client = head("Cliente")
    if not client:
        client = re.sub(r"(?i)^or[çc]amento\s*(de\s*)?", "", re.sub(r"\.(docx|pdf)$", "", name)).strip()
    date_raw, d, mo, y = _date(head("Data") or "", name) if head("Data") else _date(t, name)
    if mo and not y: y = (re.search(r"20\d\d", name) or re.search(r"20\d\d", t[:600]) or [None])[0]; y = int(y) if y else None
    service = head("Serviço") or head("Servico")
    guests_raw = head("Convidados") or head("N. pessoas") or head("N pessoas") or head("Pax")
    place = head("Local")
    lines, items, section, order = [], [], None, 0
    for raw in t.split("\n"):
        ln = raw.strip(" \t*•-–")
        if not ln or ln.startswith("## Page"): continue
        pm = PRICE_LINE.match(ln)
        if pm and "€" in ln:
            lines.append(dict(label=pm.group("label").strip(" -–:"), unit_price=num(pm.group("unit")), quantity=num(pm.group("qty")), total=num(pm.group("total")) if pm.group("total") else None, raw=ln)); continue
        hit = next(((s, rx) for rx, s in SECTIONS if re.search(rx, ln, re.I)), None)
        if hit and hit[1] and len(ln) < 60:
            section = hit[0]
            if section is None: pass
            else: continue
        if SKIP.search(ln) or section in ("prices", None): continue
        items.append(dict(section=section, position=order, text=ln)); order += 1
    total = re.findall(r"^total\s*[:=]?\s*(\d[\d.,]*)\s*€", t, re.M | re.I)
    flat = re.search(r"pre[çc]os?\s*:?\s*\n?\s*(\d[\d.,]*)\s*€", t, re.I)
    vat_rates = sorted({int(x) for x in re.findall(r"iva\s*(\d+)\s*%", t, re.I)})
    gmin = gmax = None
    if guests_raw:
        nums = [int(x) for x in re.findall(r"\d+", guests_raw)]
        if nums: gmin, gmax = min(nums), max(nums)
    elif lines:
        gmin = gmax = int(max(l["quantity"] for l in lines if l["quantity"] >= 5) or 0) or None if any(l["quantity"] >= 5 for l in lines) else None
    qid = "q:" + upload["id"]
    issues = [k for k, v in (("no date", mo), ("no total", (total or flat)), ("no guests", gmin)) if not v]
    q = dict(id=qid, file_name=name, client_name=client, event_date_raw=date_raw, event_day=d, event_month=mo, event_year=y, service_raw=service, guests_raw=guests_raw, guests_min=gmin, guests_max=gmax,
             place=place, total=num(total[-1]) if total else (num(flat.group(1)) if flat else None), vat_rates=vat_rates, price_lines=len(lines), menu_items=len(items), issues=issues,
             source={"upload_id": upload["id"], "name": name, "ext": upload.get("ext")})
    return q, [dict(id=f"{qid}:p{i + 1}", quote_id=qid, line_no=i + 1, **l) for i, l in enumerate(lines)], [dict(id=f"{qid}:m{i['position'] + 1}", quote_id=qid, **i) for i in items]
