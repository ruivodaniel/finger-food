import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["test/**/*.test.ts"],
    // .test-d.ts are type-only negatives checked by `tsc` (test:types), not vitest
    environment: "node",
  },
});
