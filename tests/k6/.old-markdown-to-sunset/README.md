# Performance Tests (k6)

k6 test scripts for load and performance testing of Seed-derived services.

## Test Types

| Script        | Purpose                 | VUs   | Duration | When to Run                 |
| ------------- | ----------------------- | ----- | -------- | --------------------------- |
| `smoke.js`    | Quick health check      | 1     | 30s      | Post-deploy CI, always safe |
| `baseline.js` | Normal load validation  | 10    | 3 min    | Stage, during work hours    |
| `stress.js`   | Find breaking points    | 10→50 | 3.5 min  | Stage, approved windows     |
| `soak.js`     | Memory leaks, stability | 5     | 27 min   | Stage, off-hours only       |

## Usage

```bash
k6 run -e BASE_URL=https://client-dev.example.com \
       -e API_URL=https://api-dev.example.com \
       tests/k6/smoke.js

k6 run -e BASE_URL=https://client-stage.example.com \
       -e API_URL=https://api-stage.example.com \
       tests/k6/baseline.js

k6 run -e BASE_URL=https://client-stage.example.com \
       -e API_URL=https://api-stage.example.com \
       tests/k6/stress.js

k6 run -e BASE_URL=https://client-stage.example.com \
       -e API_URL=https://api-stage.example.com \
       tests/k6/soak.js
```

## Environment Variables

| Variable   | Required | Description                    |
| ---------- | -------- | ------------------------------ |
| `BASE_URL` | Yes      | Web app URL                    |
| `API_URL`  | Yes      | API URL used for health checks |

## Safe Load-Test Limits (Shared Cluster)

The shared cluster runs 3× t4g.large (6 vCPU, 24 GB RAM total). These limits apply:

| Test     | Max VUs | Max Duration | Max RPS | Environment      |
| -------- | ------- | ------------ | ------- | ---------------- |
| Smoke    | 1–5     | 30s          | —       | Any              |
| Baseline | ≤20     | 5 min        | —       | Stage only       |
| Stress   | ≤50     | 5 min        | 100     | Approved windows |
| Soak     | ≤10     | 30 min       | —       | Off-hours only   |

**Never run load tests against production without explicit approval.**

## Adding New Tests

When adding auth-flow or CRUD tests:

1. Use environment variables for credentials — never hardcode
2. Clean up test data after each iteration
3. Set appropriate thresholds tied to SLO targets
4. Document the test in this README

## Performance Regression Policy

A performance regression is any measurable degradation from the established baseline that exceeds the thresholds below.

| Metric      | Threshold                      | Consequence            |
| ----------- | ------------------------------ | ---------------------- |
| p95 latency | >20% increase from baseline    | Blocks release         |
| p99 latency | >50% increase from baseline    | Blocks release         |
| Error rate  | >1% (any test)                 | Blocks release         |
| Throughput  | >15% decrease at same VU count | Investigation required |

### Baseline Management

- The scheduled `performance-baseline.yml` workflow runs weekday mornings against stage
- Baseline metrics are stored as workflow artifacts (`k6-summary.json`) for trend comparison
- After infrastructure or code changes that affect performance, re-establish the baseline and update thresholds if the change is intentional

### Regression Response

| Severity     | Trigger                    | Owner    | Action                                       |
| ------------ | -------------------------- | -------- | -------------------------------------------- |
| **P0**       | Error rate >1% in baseline | Dev team | Rollback or hotfix before next deploy        |
| **P1**       | p95 >20% degradation       | Dev team | Root-cause within sprint, fix before release |
| **P2**       | p99 >50% degradation       | Dev team | Investigate, may defer if p95 is healthy     |
| **Advisory** | Throughput decline <15%    | Dev team | Log and monitor, no action required          |

### Release Gate

Performance tests are **advisory** during the 30-day warm-up period after initial deployment. After warm-up:

- Baseline test failures on `stage` block promotion to `main`
- Stress test results inform capacity planning but do not block releases
- Soak test anomalies trigger investigation but do not block releases unless memory growth exceeds 2× initial

## Test Data Strategy

Performance tests use synthetic test data created during the test setup phase. Use a dedicated test organization/tenant when exercising authenticated or CRUD flows, and keep tests idempotent so repeated runs do not require manual cleanup.

If synthetic data is insufficient, obtain written client approval before using anonymized derivatives of client data, scrub all PII/secrets, and load it into a dedicated test database instance — never production.

## Dedicated Performance Environment

Stage is sufficient when VU count stays within shared-cluster limits, tests target only this project namespace, no other team is running concurrent performance tests, and results are compared against the project's own baseline.

Use a dedicated lean environment when stress tests exceed 50 VUs, soak tests exceed 30 minutes, client-specific SLA validation requires isolation, or database-heavy/multi-service profiles risk saturating shared resources.

## Third-Party Dependency Handling

External services must not receive real traffic during load tests.

| Dependency Type  | Strategy           |
| ---------------- | ------------------ |
| Email            | Stub / disable     |
| Payment          | Test mode only     |
| SMS              | Stub / disable     |
| Maps / Geocoding | Cache or stub      |
| AI / LLM APIs    | Deterministic mock |
| Client APIs      | Stub               |
| Auth providers   | Test accounts      |

## Scheduled Workflow

The scheduled GitHub workflow runs against the `stage` environment. Manual dispatch is restricted to `dev` and `stage`; `BASE_URL` and `API_URL` must both be configured on the selected GitHub Environment, and production-like URLs are rejected before k6 starts.
