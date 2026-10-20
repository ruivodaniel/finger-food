// ── ESLint Config — Thin Adapter ───────────────────────────────────
// This file exists ONLY for IDE real-time feedback (VS Code ESLint extension).
// It reads from lint-controls.ts — the single source of truth.
// It makes NO independent rule decisions.
// The actual lint pipeline runs via: pnpm lint:arch

import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import i18next from "eslint-plugin-i18next";
import path from "path";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";
import lintControls from "./scripts/lint/lint-controls.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── Global rules from lint-controls.ts ────────────────────────
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: path.resolve(__dirname, "tsconfig.base.json"),
      },
    },
    rules: {
      ...prettier.rules,
      ...(lintControls.eslint?.rules ?? {}),
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },
      ],
    },
  },

  // ── i18n: catch hardcoded user-facing strings in JSX ──────────
  {
    files: [
      "apps/main/shared/web/src/**/*.tsx",
      "apps/main/shared/mobile/src/**/*.tsx",
      "apps/main/slices/seed/user-organization-mgmt/web/**/*.tsx",
      "apps/main/slices/seed/user-organization-mgmt/mobile/**/*.tsx",
    ],
    ignores: ["apps/main/shared/web/src/___ref__*/**"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": ["warn", {
        mode: "jsx-text-only",
        "jsx-attributes": {
          exclude: [
            "className", "key", "type", "name", "id", "data-testid",
            "data-test", "data-slot", "htmlFor", "role", "variant",
            "size", "align", "side", "asChild", "to", "href", "src",
            "alt", "sideOffset", "collapsible",
          ],
        },
        words: {
          exclude: [
            "^/",
            "^#",
            "^\\.",
            "^@",
            "^https?:",
          ],
        },
      }],
    },
  },

  // ── Scripts are excluded from strict rules (CLI tooling) ───────
  // This is derived from the lint controls ignore patterns including "scripts/**"
  {
    files: ["scripts/**/*.{ts,tsx}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
);
