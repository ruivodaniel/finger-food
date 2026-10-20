# 🔗 API Application

[`Hono`](https://hono.dev/) backend API service with [`Better Auth`](https://www.better-auth.com/) authentication and scoped access control.

## 📁 Structure

### 🧪 Testing ([`__test__/`](__test__/))

Unit testing configuration and test files

### 🗄️ Database ([`drizzle/`](drizzle/))

Database schema migrations and metadata

### 🛠️ Scripts ([`scripts/`](scripts/))

Development and database-seeding scripts

### 📦 Source Code ([`src/`](src/))

- **⚙️ Wiring** ([`src/wiring/`](src/wiring/)): App composition — module mounting, cross-module hooks, and notification/wizard wiring
- **⏰ Cron** ([`src/cron/`](src/cron/)): Scheduled job runners
- **🧩 Features** ([`src/features/`](src/features/)): App-owned vertical slices (router → service → repository → model), e.g. `notes`
- **📚 Lib** ([`src/lib/`](src/lib/)): Boundary adapters and cross-cutting infrastructure (db, redis, S3, email, SMS, logging, observability, realtime)
- **🔒 Middlewares** ([`src/middlewares/`](src/middlewares/)): Request-processing middleware
- **🏗️ Models** ([`src/models/`](src/models/)): The drizzle schema barrel — aggregates the module, feature, and app-slice tables for the client and migrations
- **🔁 Workflow-intents** ([`src/workflow-intents/`](src/workflow-intents/)): The durable workflow-intent outbox (commit-then-nudge: model + repository + service + helpers)
- **🛣️ Routes** ([`src/routes/`](src/routes/)): Route registration (`client/` public, `m2m/` worker seam)

### 🐳 Docker

- **[`Dockerfile`](Dockerfile)**: Container configuration for deployment
- **[`docker-compose.yml`](docker-compose.yml)**: Local development environment setup

## 🏃‍♂️ Running the Project

### Development Server

_**Note:** Ensure you follow the setup steps from the root [README.md](../../README.md) before running the development server._

```bash
# Start the API in development mode
pnpm run dev
```

## 🚀 Deployment

The API application is built and deployed through GitHub Actions CI/CD pipelines. For detailed deployment workflows and configuration, refer to [.github/README_CICD.md](../../.github/README_CICD.md).
