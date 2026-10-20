import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "./__test__/unit/**/*.test.ts",
      // Colocated unit tests in seed slices mounted by this app.
      // (Add additional slice paths as coverage grows.)
      "../../slices/seed/user-organization-mgmt/api/lib/**/*.test.ts",
    ],
    setupFiles: "./__test__/unit/config/setup.ts",
  },
  plugins: [tsconfigPaths()],
});
