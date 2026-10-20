import { defineConfig } from "vitest/config";

// Contract tests exercise the live dev compose stack (Kratos + maildev) and
// self-skip when it isn't running. Kept out of the docker-free unit run.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.contract.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
