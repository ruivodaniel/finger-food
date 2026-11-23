# Finger Food

The operating system of a catering business: the catalogue and what it is made of, the proposals, the events, the stock and the invoices.

This repository starts from the seed (the `main` app and the shared libraries and configs, as they are in the seed). The first version of the project is on the branch `1st-version`.

## What is here

| Folder | Holds |
|---|---|
| `apps/main/core/api` | The API (Hono, Drizzle, PostgreSQL) |
| `apps/main/core/web` | The web app of the seed. No Finger Food screen exists yet |
| `apps/main/slices/seed` | The seed's slices. Users, organizations and sign-in are `user-organization-mgmt` |
| `apps/main/slices/product/finger-food` | The Finger Food slice: its ERD and its database models. No API and no screens yet |
| `shared` | The seed's libraries and configs |
| `data` | The source data of the business, and what the loaders read |
| `scripts/finger-food` | The generator of the models |

## Differences from the seed

- **Sign-in has no Kratos.** The local identity provider sits behind the seed's identity port, on the app's own Postgres: a code sent by email, sessions kept by the app. No password, no TOTP, no SMS. The module still builds the Kratos adapter when the app gives none (`apps/main/core/api/src/mounts.ts`).
- **Only the `main` app.** No orchestrator, open-api, workers, trigger-dev, helm or terraform.
- **Local services have their own names and ports**, so they run beside the seed's.

| Service | Where |
|---|---|
| API | http://localhost:3011 |
| Postgres | localhost:5437, database `finger_food` |
| Mail catcher (the sign-in codes arrive here) | http://localhost:1082 |

## Setup

Needs Node 22.16 or later, pnpm 10.11 or later, and Docker.

```bash
pnpm install
cp apps/main/core/api/.env.example apps/main/core/api/.env
cp apps/main/core/api/.env.secrets.example apps/main/core/api/.env.secrets
cp apps/main/core/web/.env.example apps/main/core/web/.env
docker compose -f apps/main/core/api/docker-compose.yml up -d postgres maildev
pnpm --filter @apps/api run db:seed -y
pnpm ff:load
pnpm ff:check
```

`db:seed` empties the database, runs the migrations and creates the system admin. `ff:load` then loads the Finger Food data. Both can be run again.

## The model

The ERD is canon: `apps/main/slices/product/finger-food/erd/design.dbml`. The Drizzle models are generated from it.

```bash
pnpm ff:model
pnpm --filter @apps/api run db:generate
pnpm db:migrate
```

The ERD's table `purchase` is `article_purchase` in the database, because the seed's payment slice already has a table called `purchase`.

## The data

| Folder | Holds |
|---|---|
| `data/ontology-v04` | The ingredients tree: 2 258 ingredients and their branches, in English, with aliases. See its `ATTRIBUTION.md` |
| `data/catalogue` | The components, the menu items, the segments, the event types and the distribution rules, as reviewed |
| `data/composition` | What each component is made of (`components.txt`) and the food rules (`food-rules.json`) |
| `data/raw` | The proposals, invoices and payments extracted from the documents of the business |

Three loaders, in this order, in `apps/main/core/api/scripts/finger-food`:

| Loader | Writes |
|---|---|
| `load-catalogue.ts` | The catering company, the ontology, the substances, the food rules, the components and their composition, the menu items, the distribution rules |
| `load-templates.ts` | The proposal templates |
| `load-history.ts` | The clients, events, proposals with their moments and lines, invoices, credit notes and payments |

`check.ts` prints the rows per table, compares the invoiced totals per year with the invoice files, and prints what the food rules answer for every menu item.

### What the data is not

- **The composition was read from the names, by hand.** No label was read. A component is marked complete only when it is one raw thing (a carrot, a banana). Every other composition is partial: the rules warn on what is listed and answer unknown for the rest.
- **The food rules are a first pass.** Their node lists were chosen by name from the ingredients tree, and the limit numbers are placeholders.
- **No values** (carbohydrates, sugars, salt) are loaded, so the rules with a limit answer unknown.
- **No articles, vendors, prices or stock.** No data exists for them yet.
