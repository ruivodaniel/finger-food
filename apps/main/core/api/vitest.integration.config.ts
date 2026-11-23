import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";

// Integration tier (distinct from `vitest.unit.config.ts`): these mount the
// REAL access-control config + engine + gated-db + the module's real drizzle
// models against a REAL Postgres (PGlite, in-memory — no docker). They prove
// default-deny is live end-to-end for the shipping config, so they carry the
// cost of a real database and live in their own tier rather than the fast unit
// suite (TST1's tiering: this sits above unit, below e2e HTTP).
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["./__test__/integration/**/*.test.ts"],
    setupFiles: "./__test__/unit/config/setup.ts",
  },
  plugins: [tsconfigPaths()],
});
