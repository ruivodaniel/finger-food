# Docs: how to view

The docs are one database in `db/`: every doc, glossary term and ADR entry is an entry with tags and the paths it is specific to.

## View

One command builds the index and serves the repo root, from any folder:

```bash
node docs/engine/serve.mjs
```

then open http://localhost:8901/docs/. Search and filters are in the sidebar.

## Check

```bash
node docs/engine/validate-docs.mjs
```

## Layout

```
docs/
├── README.md
├── engine/
│   ├── build.ts             writes db/index.json (metadata, compliance) and db/search.json
│   ├── remove.ts            removes by path from the database (dry run, --apply)
│   ├── serve.mjs            builds, then serves the repo root
│   ├── viewer.html          the one viewer: groups, filters, search, glossary
│   ├── doc.types.ts         the types of an entry and of its payloads
│   └── validate-docs.mjs
├── db/
│   ├── doc/  term/  adr/  standards/   one json file per entry
│   ├── assets/<doc-id>/                 images and html of a doc
│   └── index.json  search.json          generated
└── .old-markdown-to-sunset/ markdown waiting to be deleted
```

An entry has a kind, a title, a status (todo, converted, approved), tags and paths. No path: global.
Remove part of the repo from the database:

```bash
node docs/engine/remove.ts shared/libs/ui          # dry run
node docs/engine/remove.ts shared/libs/ui --apply
```
