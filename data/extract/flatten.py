"""Flattens the agents' JSON (one file per distinct proposal) into tables: proposals, moments, menu_lines, menu_items, price_lines. Nothing is cleaned or merged; ids point up."""
import glob, json, os
HERE = os.path.dirname(__file__)
def load():
    shards = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(HERE, "agents/shard-[0-9]*.json")))]
    outs = [s["out"] for sh in shards for s in sh]
    P, M, L, I, R = [], [], [], [], []
    for out in outs:
        d = json.load(open(out)); pid = d["quote_id"].replace("q:", "p:")
        P.append(dict(id=pid, client=d["client"], client_source=d.get("client_source"), place=d.get("place"), n_moments=len(d["moments"]), event_dates=d["event_dates"], total_written=d.get("total"), upload_id=os.path.basename(out)[:-5]))
        for mi, m in enumerate(d["moments"]):
            mid = f"{pid}:m{mi + 1}"
            M.append(dict(id=mid, proposal_id=pid, position=mi + 1, name_as_written=m.get("name_as_written"), service_type=m.get("service_type"), guests=m.get("guests"), guests_raw=m.get("guests_raw")))
            for li, l in enumerate(m.get("menu_lines", [])):
                lid = f"{mid}:l{li + 1}"
                L.append(dict(id=lid, moment_id=mid, proposal_id=pid, position=li + 1, segment=l.get("segment"), n_items=len(l.get("items", []))))
                for ii, it in enumerate(l.get("items", [])):
                    I.append(dict(id=f"{lid}:i{ii + 1}", menu_line_id=lid, moment_id=mid, proposal_id=pid, position=ii + 1, text=it["text"], quantity=it.get("quantity"), segment=l.get("segment")))
            for pi, p in enumerate(m.get("prices", [])):
                R.append(dict(id=f"{mid}:p{pi + 1}", moment_id=mid, proposal_id=pid, **{k: p.get(k) for k in ("label", "unit_price", "quantity", "line_total", "vat_rate")}))
    return P, M, L, I, R
