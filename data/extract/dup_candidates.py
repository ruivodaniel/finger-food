"""Candidate neighbourhoods for the duplicate hunt. Items that may be the same are put in one neighbourhood by a loose similarity (shared rare words or similar spelling);
the agents then judge each neighbourhood. This pass decides nothing: it only keeps each agent's cluster small. Run: python3 dup_candidates.py"""
import json, os, re, difflib, collections
HERE = os.path.dirname(__file__)
A = json.load(open(os.path.join(HERE, "..", "analysis", "aggregates.json")))
items = [x for x in A["items_by_name"] if x["name"]]
STOP = set("c com de do da dos das e ou em a o as os p para x um uma no na com sem ao".split())
toks = {x["name"]: set(t for t in x["name"].split() if t not in STOP and len(t) > 1) for x in items}
df = collections.Counter(t for s in toks.values() for t in s)
names = [x["name"] for x in items]; idx = {n: i for i, n in enumerate(names)}
parent = list(range(len(names)))
def find(i):
    while parent[i] != i: parent[i] = parent[parent[i]]; i = parent[i]
    return i
def union(a, b): parent[find(a)] = find(b)
by_tok = collections.defaultdict(list)
for n, s in toks.items():
    for t in s: by_tok[t].append(n)
edges = 0
for t, ns in by_tok.items():
    if len(ns) > 45: continue          # a word in many items ("de", "salgado") says little
    for i, a in enumerate(ns):
        for b in ns[i + 1:]:
            ja = len(toks[a] & toks[b]) / max(1, len(toks[a] | toks[b]))
            if ja >= .34 or difflib.SequenceMatcher(None, a, b).ratio() >= .72:
                union(idx[a], idx[b]); edges += 1
comps = collections.defaultdict(list)
for n in names: comps[find(idx[n])].append(n)
by = {x["name"]: x for x in items}
groups = [sorted(c, key=lambda n: -by[n]["count"]) for c in comps.values()]
sizes = collections.Counter(min(len(g), 60) for g in groups)
print("items", len(names), "neighbourhoods", len(groups), "alone", sum(1 for g in groups if len(g) == 1), "largest", max(len(g) for g in groups))
print("size distribution (1..):", sorted(sizes.items())[:14])
multi = [g for g in groups if len(g) > 1]
# big neighbourhoods are cut in pieces of at most 40 by the most frequent item first
pieces = []
for g in multi:
    if len(g) > 40: g = sorted(g)      # a big neighbourhood is cut alphabetically: similar names stay next to each other
    for i in range(0, len(g), 40): pieces.append(g[i:i + 40])
pieces.sort(key=lambda g: -sum(by[n]["count"] for n in g))
N = 5; shards = [[] for _ in range(N)]; load = [0] * N
for p in pieces:
    k = load.index(min(load)); shards[k].append(p); load[k] += len(p)
os.makedirs(os.path.join(HERE, "agents"), exist_ok=True); os.makedirs(os.path.join(HERE, "..", "analysis", "dup"), exist_ok=True)
for k, sh in enumerate(shards, 1):
    json.dump(dict(out=os.path.abspath(os.path.join(HERE, "..", "analysis", "dup", f"{k}.json")), neighbourhoods=[[dict(item=n, count=by[n]["count"], example=by[n]["spellings"][0]) for n in p] for p in sh]), open(os.path.join(HERE, "agents", f"dup-shard-{k}.json"), "w"), indent=1, ensure_ascii=False)
print("pieces", len(pieces), "items in them", sum(len(p) for p in pieces), "per shard", [sum(len(p) for p in s) for s in shards])
