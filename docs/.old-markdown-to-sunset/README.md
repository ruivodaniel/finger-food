# Seed docs — how to view

Docs are JSON files rendered by one generic viewer — there is no per-document HTML.
The viewer fetches JSON, so it needs HTTP — it cannot be opened via `file://`.

## Run

```bash
cd /Users/danieldedecastroruivo/DEV/OmniChord-26/docs && npx serve -l 8901
```

then open **http://localhost:8901/** — it lands on the viewer. Ctrl-C stops it.

## Validate

Every doc must comply with the shared interface (`system/doc.types.ts`). Check compliance:

```bash
cd /Users/danieldecastroruivo/Dev/OmniChord-26/docs && node system/validate-docs.mjs
```

## Layout

```
docs/
├── index.json              the reference index — groups + sidebar order (order lives ONLY here)
├── index.html              redirect: bare root → system/viewer.html
├── system/
│   ├── viewer.html         the one generic reader — renders any compliant doc, agnostic to content
│   ├── doc.types.ts         the interface every doc JSON must satisfy
│   ├── validate-docs.mjs    compliance checker
│   ├── glossary.json        glossary — different shape from a doc (no axiom/purpose/reference)
│   └── standards.json       standards consumption tracker — temporary, disappears once fully digested
└── docs/
    └── <doc-id>/
        ├── <doc-id>.json    the doc itself: Axiom → Purpose → Reference
        └── assets/          binary images and self-contained HTML fragments this doc's JSON references
```

No numbers anywhere — not in filenames, not in `id` fields. A doc's `id` is its slug
(`scaffolding-and-import-boundaries`, not `02`). Reading order comes only from
`index.json`; reorganizing later never breaks a link, since the viewer routes by `id`
(`?doc=<id>`), not by file path.

## What's canonical right now

Only `docs/scaffolding-and-import-boundaries/` — and even that one is unfinished: its
axioms are reviewed and closed, but its Reference was drafted by an agent pulling
standards it judged applicable, and Daniel hasn't reviewed those claims yet (see the
`unreviewed` badge on that doc's Reference section in the viewer).

`system/standards.json` is not canon and never will be — it's a digestion tracker for
rules an colleague's meeting-transcript tool auto-generated. Some of those rules are
right, some are wrong; a rule only matters once it's been reviewed and lands, rewritten
as needed, in an actual doc under `docs/`. When every rule is consumed, this file is
deleted.
