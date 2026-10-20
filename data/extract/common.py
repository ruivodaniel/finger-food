"""Shared helpers: where the sources are, the upload registry, number parsing, jsonl/csv output."""
import csv, json, os, re, unicodedata

SLICE_DESIGN = os.environ.get("SLICE_DESIGN", "/Users/danieldedecastroruivo/DEV/OmniChord-26/slice-design")
REGISTRY = os.path.join(SLICE_DESIGN, "projects/FINGER-FOOD/slices/finger-food/shared/uploads/core.json")
BLOBS = os.path.join(SLICE_DESIGN, "blobs/uploaded")
OUT = os.environ.get("RAW_OUT", os.path.join(os.path.dirname(__file__), "..", "raw"))

def nfc(s): return unicodedata.normalize("NFC", s or "")

class Registry:
    """The uploads registry: uploads, folders and which folder holds which upload."""
    def __init__(self):
        self.entities = json.load(open(REGISTRY, encoding="utf-8"))["entities"]
        self.by_id = {e["id"]: e for e in self.entities}
        self.parent_of = {}
        for f in self.entities:
            if f.get("kind") == "folder":
                for i in f.get("items", []): self.parent_of[i] = f
    def folder_path(self, upload):
        names, f = [], self.parent_of.get(upload["id"])
        while f:
            names.append(nfc(f["name"]).strip()); f = self.by_id.get(f.get("parentId"))
        return "/".join(reversed(names))
    def uploads(self, folder_prefix):
        p = nfc(folder_prefix)
        for e in self.entities:
            if e.get("kind") == "upload" and e.get("active", True) and self.folder_path(e).startswith(p): yield e
    def text(self, upload):
        """The MuPDF text conversion of an upload, normalized; None when there is none."""
        path = os.path.join(BLOBS, upload["id"], "converted/text/document.md")
        if not os.path.exists(path): return None
        t = open(path, encoding="utf-8").read().replace("\xa0", " ").replace(" ", " ")
        return re.sub(r"\n\s*\n", "\n", nfc(t))
    def source(self, upload):
        c = next((c for c in upload.get("conversions", []) if c["mode"] == "text" and c["status"] == "ok"), None)
        return glob_source(upload["id"])

def glob_source(upload_id):
    d = os.path.join(BLOBS, upload_id)
    return next((os.path.join(d, f) for f in os.listdir(d) if f.startswith("source")), None)

def num(s):
    """'1 469,00' '1.469,00' '1,469.00' '8,50' '8.5' -> float"""
    s = s.replace(" ", "").replace("\xa0", "")
    if "," in s and "." in s: s = s.replace(".", "") if s.rfind(",") > s.rfind(".") else s.replace(",", "")
    return float(s.replace(",", "."))

def write_table(name, rows):
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, name + ".jsonl"), "w", encoding="utf-8") as f:
        for r in rows: f.write(json.dumps(r, ensure_ascii=False) + "\n")
    cols = []
    for r in rows:
        for k in r:
            if k not in cols: cols.append(k)
    with open(os.path.join(OUT, name + ".csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f); w.writerow(cols)
        for r in rows: w.writerow([json.dumps(r.get(c), ensure_ascii=False) if isinstance(r.get(c), (dict, list)) else r.get(c) for c in cols])
    return len(rows)
