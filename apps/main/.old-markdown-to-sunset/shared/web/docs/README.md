# apps/web-main — Documentation

**What.** The React 19 + TanStack Router web app that mounts module-contributed pages, owns the shell, and renders the product.
**How.** Imports each module's public web surface (provider, route contribution, nav contribution, requirements guard, sidebar widgets), wires app-level adapters (router, toast, api client, auth client, query client), and assembles the route tree under one root.
**Why.** Modules expose what they DO; the app decides what's MOUNTED, where it sits in the shell, and what the user actually sees. That split is what lets one set of modules serve many products.

---

> **This file is the MAP for the web app. Rules live in their owners' docs.**

## Two doc sets

| Folder | Audience |
|--------|----------|
| [`seed-patterns/`](./seed-patterns/) | Frozen patterns inherited from the seed — shell wiring (Shell + ShellSideNav + Page), provider composition order, route assembly, adapter pattern, mixed-ownership sections (settings shell), workspace path resolution. Don't break without thinking. |
| [`product-specific/`](./product-specific/) | This product's choices — theme, brand, app-only routes, app-only components, env config. Yours to evolve. |

## Where to look first

| If you're … | Read this first |
|---|---|
| Adding a route | [`seed-patterns/`](./seed-patterns/) + central [`docs/01_reference/frontend-composition.md`](../../../docs/01_reference/frontend-composition.md) |
| Adding an app-only page | [`product-specific/`](./product-specific/) + frontend-composition doc |
| Changing the app shell or sidebar | [`seed-patterns/`](./seed-patterns/) (Shell wiring) + [`shared/libs/ui/docs/`](../../../shared/libs/ui/docs/) (layouts) |
| Adding UI styling | [`shared/libs/ui/docs/`](../../../shared/libs/ui/docs/) — markup contract, no aesthetic Tailwind |
| Adding a workspace dependency | central [`docs/01_reference/import-boundaries.md`](../../../docs/01_reference/import-boundaries.md) — pnpm workspace deps, no custom aliases |
