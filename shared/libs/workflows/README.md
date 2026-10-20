# @libs/workflows

Shared infrastructure contracts for the workflow orchestration pipeline. Consumed by `apps/api` and `apps/trigger-dev`.

## Scope

| Exports | Must not export |
|---|---|
| Kind constants (`workflowKinds`) | Drizzle tables or any DB model |
| Zod payload schemas (`workflowIntentPayloadSchemas`) | Trigger.dev SDK values (`Task<>`, `tasks`, `schedules`, etc.) |
| `SafeError` type + `sanitizeError` | Product-domain processor code |
| `pickSafeLogFields` (allowlist is internal) | Runtime processes, schedulers, or connections |
| `calculateBackoffMs`, `nextAvailableAt`, `DEFAULT_*` retry constants | Feature logic (lives in apps) |
| `workflowIntentIdempotencyKey`, `workflowIntentWorkerId` | App wiring or HTTP routes |
| Workflow-intent status types (`WorkflowIntentStatus`, `ActiveWorkflowIntentStatus`) | |

## Hard rules

- No import of `drizzle-orm`, `@trigger.dev/*`, or any app/module code. Stays runtime-agnostic.
- Every export is a pure type, pure function, constant, or Zod schema. Extract-to-npm must remain trivial.
- PHI safety rules (log allowlist, error sanitization, redaction helpers) live here because both apps share them.
- Changes to `SAFE_LOG_FIELD_NAMES` or `workflowIntentPayloadSchemas` are deploy-coupling risks. `apps/api` and `apps/trigger-dev` must ship from the same commit of this lib.

## Load-bearing surfaces

- `workflowIntentPayloadSchemas[kind]` — the single source of truth for payload validation, enforced on both enqueue (API) and execute (worker).
- `pickSafeLogFields` — the PHI safety gate used by worker logs, reconciler telemetry, and `dispatchAfterCommit`.
- `SafeError` / `sanitizeError` — the only shape `fail-intent` accepts; guarded by Zod.
- `calculateBackoffMs` — shared retry math so both apps agree on jitter, exponent, and cap.

## Add a workflow kind (shared-lib side)

1. Create `src/<kind>/<kind>-intent.schema.ts` with a strict Zod schema (IDs + orchestration metadata only — no PHI).
2. Export the kind string from `src/workflow-kinds.ts`.
3. Add it to `workflowIntentPayloadSchemas` in `src/workflow-intent.schemas.ts`.
4. Write the corresponding processor + registration in `apps/trigger-dev`. See that package's README.

## Tests

```bash
pnpm --filter @libs/workflows test:unit
```

All behavior here is pure. Full unit coverage is the contract.
