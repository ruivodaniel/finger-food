# Seed

Monorepo seed for building multi-tenant SaaS products: authentication (Ory Kratos),
users & organizations, scoped access control, notifications, file storage and a
durable job queue — pre-wired. You configure **what** your product is in `configs/`;
the seed handles **how** it runs.

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| API | [Hono](https://hono.dev) + [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL |
| Identity | [Ory Kratos](https://www.ory.sh/kratos) (runs in Docker, fully automated — see below) |
| Frontend | [React](https://react.dev) + [TanStack Router](https://tanstack.com/router) + [shadcn/ui](https://ui.shadcn.com) |
| Access control | `shared/libs/gated-scoped-ac` — DSL-configured, compile-time-gated DB access |
| Jobs | Durable outbox (`workflow_intent`) + BullMQ/Redis (`apps/workers`) |

## Setup

Prerequisites: [Node.js](https://nodejs.org) ≥ 22.16 · [pnpm](https://pnpm.io) ≥ 10.11 · [Docker](https://www.docker.com/products/docker-desktop).

```bash
# 1. Install dependencies
pnpm install

# 2. Environment — local defaults work as-is, no editing needed
cp apps/main/shared/api/.env.example apps/main/shared/api/.env
cp apps/main/shared/web/.env.example apps/main/shared/web/.env

# 3. Infrastructure + database (Docker services, migrations, seed)
pnpm run setup
```

`pnpm run setup` starts every local service via Docker — including **Kratos**
(its own container and database; created, migrated and served automatically —
there is nothing to install or configure) — then runs the app migrations and
seeds an admin account.

### Seeded system admin

Local dev credentials (defined in `apps/main/shared/api/scripts/seed-db.ts`):

| | |
|---|---|
| Email | `danielcastroruivo@gmail.com` |
| Password | `Altario2026!` |
| Org / role | PROWD System Admin · `system_admin_owner` |

TOTP cannot be seeded, so the first login is gated (HTTP 428): you land in the
`/resolve` wizard, which walks you through enrolling an authenticator.

### Run

In separate terminals:

```bash
pnpm run dev:api        # API       → http://localhost:3000
pnpm run dev:web-main   # Frontend  → http://localhost:5173
```

Optional processes:

```bash
pnpm run dev:workers    # queue consumers — only needed when QUEUE_MODE=redis (local default is inline)
pnpm run dev:trigger    # Trigger.dev tasks (optional)
pnpm run dev:mobile     # Expo (custom dev client — see apps/main/shared/mobile/README.md)
pnpm --dir apps/api run smsdev   # local SMS inbox for OTP flows
```

### Doker / Local services

Manage Docker separately with `pnpm run docker:up` / `pnpm run docker:down`.

| Service | Where | Purpose |
|---------|-------|---------|
| Postgres | `localhost:5433` | App database (+ Kratos' own db on the same instance) |
| Kratos | http://localhost:4433 (public) · :4434 (admin) | Identity provider |
| Maildev | http://localhost:1080 | Local email inbox — all outgoing mail lands here |
| Redis | `localhost:16379` | Queue backend (used when `QUEUE_MODE=redis`) |
| LocalStack | http://localhost:4566 | S3 emulator for file uploads |


## Project structure

```
├── apps/
│   ├── api/           Hono backend — mounts modules & features (src/mounts.ts)
│   ├── web-main/      React frontend
│   ├── workers/       Queue consumers for the durable outbox (see its README)
│   ├── trigger-dev/   Trigger.dev tasks (optional)
│   └── mobile/        Expo app
├── configs/           Product configuration (access control DSL, auth, brand, …)
├── shared/
│   ├── libs/          Generic engines — gated-scoped-ac, realtime, queue, storage, ui, …
│   └── modules/       Self-contained domains — user-organization-mgmt, notifications
├── team-cockpit/      Internal dev cockpit + e2e engine
├── scripts/           Setup & project scripts
├── terraform/ helm/   Infrastructure & deployment
```

## Documentation

| Area | Location |
|------|----------|
| Architecture rules & standards | [docs/](docs/) — see [docs/README.md](docs/README.md) to run the viewer |
| Documentation index | [INDEX.md](INDEX.md) |
| Shared layer | [shared/README.md](shared/README.md) |
| API | [apps/main/shared/api/README.md](apps/main/shared/api/README.md) |
| Frontend | [apps/main/shared/web/README.md](apps/main/shared/web/README.md) |
| Workers & job queue | [apps/workers/README.md](apps/workers/README.md) |
| Product configs | [configs/README.md](configs/README.md) |
