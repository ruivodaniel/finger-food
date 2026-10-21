# data/ — raw extraction

Turns the client's documents (already converted to text with MuPDF in slice-design's blob store) into flat tables.
Nothing here is cleaned or merged: every row keeps what was written and points to its source file.

```
python3 data/extract/run.py        # rebuilds data/raw/*.jsonl and data/raw/*.csv
```

Sources are read from the OmniChord-26 repo (`SLICE_DESIGN` env var, default `~/DEV/OmniChord-26/slice-design`):
the uploads registry of the FINGER-FOOD project and `blobs/uploaded/<id>/converted/text/document.md`.

## Tables (data/raw)

| table | one row per | notes |
|---|---|---|
| documents | source file | status: ok, issue, duplicate, skipped, no text |
| invoices | invoice | number, issue/due date, customer name and tax id as printed, payment terms, net, VAT, gross. Credit notes are negative |
| invoice_lines | invoice line | description as printed, quantity, unit price, discount, VAT rate, gross total |
| quotes | quote file | client and date as written, service, guests (raw and min/max), place, total when written. `issues` lists what is missing |
| quote_lines | price line of a quote | "Comidas 18€ x 60 = 1080€": label, unit price, quantity, total |
| quote_menu_items | menu line of a quote | section and text as written; to be matched to the reviewed menu items later |
| payments | row of Gonçalo's invoice list | issue date, net/VAT/gross, date received, cancelled flag. Only 2023-2024 |

Known limits: a quote's year is only set when written; 12 non-invoice PDFs are skipped; quotes without a written total or guest count have it empty, never guessed.
Loading into Postgres: `COPY` from the CSVs (JSON columns hold JSON text), or read the jsonl.

## ERD outputs (data/erd) — stale

`migrate/to_erd.py` wrote these before the ERD changed (item → component, the ontology, no segment enum). They are not to be loaded.
The next migration starts from the reviewed data in the slice-design exploration `data-cleansing` (components, menu items with their components),
and maps each line of the history to a menu item or to an ad hoc line.
