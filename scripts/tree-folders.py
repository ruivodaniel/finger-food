#!/usr/bin/env python3
"""
Deterministic ASCII tree of tracked folders.
Lists every directory with at least one tracked file, ignoring gitignored.
"""
import subprocess
import sys

dirs = subprocess.check_output(
    ["git", "ls-tree", "-dr", "--name-only", "HEAD"],
    text=True,
).splitlines()
dirs.sort()

tree: dict = {}
for d in dirs:
    cur = tree
    for part in d.split("/"):
        cur = cur.setdefault(part, {})

def render(node: dict, prefix: str = "") -> None:
    items = sorted(node.items())
    for i, (name, sub) in enumerate(items):
        last = i == len(items) - 1
        connector = "└── " if last else "├── "
        print(prefix + connector + name)
        ext = "    " if last else "│   "
        render(sub, prefix + ext)

print(".")
render(tree)
