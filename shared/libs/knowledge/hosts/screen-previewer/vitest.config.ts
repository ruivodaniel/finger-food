// The tests of the screen previewer host (v3/tests, v4/tests, v5/tests) and of the screen previewer pattern's UI documents. Run from this folder with the repo's vitest: ../../../../../node_modules/.bin/vitest run --root .
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const MOUNT = resolve(__dirname, "../../../../..");
const LIB = resolve(MOUNT, "shared/libs/ui");
const EMPTY = resolve(__dirname, "v3/tests/empty.ts");

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      // React is the consumer's: here, the UI library's copy
      { find: /^react$/, replacement: resolve(LIB, "web/node_modules/react") },
      { find: /^react\/jsx-runtime$/, replacement: resolve(LIB, "web/node_modules/react/jsx-runtime") },
      { find: /^react\/jsx-dev-runtime$/, replacement: resolve(LIB, "web/node_modules/react/jsx-dev-runtime") },
      { find: /^react-dom$/, replacement: resolve(LIB, "web/node_modules/react-dom") },
      { find: /^react-dom\/client$/, replacement: resolve(LIB, "web/node_modules/react-dom/client") },
      { find: "@libs/knowledge/hosts/screen-previewer", replacement: __dirname },
      { find: "@libs/web-components-src", replacement: resolve(LIB, "web/primitives/components") },
      { find: "@libs/web-components", replacement: resolve(LIB, "web/index.ts") },
      { find: "@libs/web-layouts", replacement: resolve(LIB, "web/primitives/layouts/index.ts") },
      { find: "@libs/data-processor", replacement: resolve(MOUNT, "shared/libs/data-processor/src/index.ts") },
      { find: "@libs/value-types", replacement: resolve(MOUNT, "shared/libs/value-types/src/index.ts") },
      { find: "@libs/ui-types", replacement: resolve(LIB, "types/index.ts") },
      { find: "@libs/mobile-components/schemas", replacement: resolve(LIB, "mobile/components/src/schemas.ts") },
      { find: "@libs/mobile-layouts/schemas", replacement: resolve(LIB, "mobile/layouts/src/schemas.ts") },
      // web only: the mobile libraries (react native) resolve to nothing
      { find: "@libs/mobile-components", replacement: EMPTY },
      { find: "@libs/mobile-layouts", replacement: EMPTY },
      { find: "@libs/list-query/client", replacement: resolve(MOUNT, "shared/libs/list-query/src/client/index.ts") },
      { find: "@libs/list-query", replacement: resolve(MOUNT, "shared/libs/list-query/src/index.ts") },
      { find: "@libs/rich-text-editor", replacement: resolve(MOUNT, "shared/libs/rich-text-editor/src/index.ts") },
      { find: "@libs/ui-data", replacement: resolve(LIB, "ui-data/src") },
    ],
  },
  test: { environment: "jsdom", include: ["v3/tests/**/*.test.ts", "v4/tests/**/*.test.ts", "v5/tests/**/*.test.ts"], server: { deps: { inline: [/shared\/libs/] } } },
});
