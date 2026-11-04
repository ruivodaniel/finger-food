"""Merges the agents' duplicate groups into the file the page reads. Checks every member against the real item list (an invented name is dropped), keeps an item in one group only,
and makes the most used item the parent. Run: python3 dup_merge.py <out.json>"""
import glob, json, os, sys, datetime
HERE = os.path.dirname(__file__)
A = json.load(open(os.path.join(HERE, "..", "analysis", "aggregates.json")))
by = {x["name"]: x for x in A["items_by_name"]}
RANK = {"same": 0, "probably": 1, "maybe": 2}
raw, dropped, files = [], [], []
for f in sorted(glob.glob(os.path.join(HERE, "..", "analysis", "dup", "*.json"))):
    d = json.load(open(f)); files.append(os.path.basename(f))
    for g in d.get("groups", []):
        mem = [m for m in g.get("members", []) if m in by]
        dropped += [m for m in g.get("members", []) if m not in by]
        if len(set(mem)) >= 2 and g.get("confidence") in RANK: raw.append(dict(members=list(dict.fromkeys(mem)), confidence=g["confidence"], why=g.get("why", "")))
# rulings by the author: a group he regrouped; its members leave every agent group they were in
RULINGS = json.load(open(os.path.join(HERE, "..", "analysis", "dup_rulings.json"))) if os.path.exists(os.path.join(HERE, "..", "analysis", "dup_rulings.json")) else []
ruled = {m for r in RULINGS for m in r["members"]}
for g in raw: g["members"] = [m for m in g["members"] if m not in ruled]
for r in RULINGS: raw.append(dict(members=[m for m in r["members"] if m in by], confidence="same", why=r["why"], ruled=True, parent=r.get("parent")))
used, groups = set(), []
for g in sorted(raw, key=lambda g: (not g.get("ruled"), RANK[g["confidence"]], -len(g["members"]))):
    mem = [m for m in g["members"] if m not in used]
    if len(mem) < 2: continue
    used.update(mem)
    mem.sort(key=lambda m: (m != g.get("parent"), -by[m]["count"]))   # a ruled group keeps the parent the author named; otherwise the most used leads
    chunk = lambda m: dict(name=m, count=by[m]["count"], proposals=by[m]["proposals"], spellings=by[m]["spellings"][:5])
    groups.append(dict(id="g" + str(len(groups) + 1), parent=chunk(mem[0]), children=[chunk(m) for m in mem[1:]], confidence=g["confidence"], why=g["why"], total=sum(by[m]["count"] for m in mem)))
groups.sort(key=lambda g: -g["total"])
for i, g in enumerate(groups, 1): g["id"] = f"g{i}"
json.dump(dict(generated=datetime.datetime.utcnow().isoformat(), groups=groups), open(sys.argv[1], "w"), ensure_ascii=False)
import collections
print("files", files, "| agent groups", len(raw), "| invented names dropped", len(dropped), dropped[:5])
print("groups", len(groups), dict(collections.Counter(g["confidence"] for g in groups)), "| items in groups", len(used), "| would fold", sum(len(g["children"]) for g in groups))
