// ── ESLint Processor ──────────────────────────────────────────────
// Delegates to ESLint's Node API. Normalizes results to LintViolation.
// Reads rules from control sets, builds flat config, runs ESLint.

import * as path from "path";
import { glob } from "glob";
import { ESLint } from "eslint";
import tseslint from "typescript-eslint";
import js from "@eslint/js";
import reactRefresh from "eslint-plugin-react-refresh";
import type {
  EslintControls,
  EslintRuleValue,
  LintViolation,
  LoadedControlSet,
  Severity,
} from "../types.ts";

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

export async function processEslintControls(
  controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  // Merge global ESLint rules
  let globalRules: Record<string, EslintRuleValue> = {};
  const overrideBlocks: Array<{ files: string[]; rules: Record<string, EslintRuleValue>; owner: string }> = [];

  for (const cs of controlSets) {
    if (!cs.controls.eslint) continue;
    if (cs.controls.eslint.enabled === false) continue;

    if (cs.owner === "global" && cs.controls.eslint.rules) {
      globalRules = { ...globalRules, ...cs.controls.eslint.rules };
    }

    if (cs.controls.eslint.overrides && cs.owner !== "global") {
      overrideBlocks.push({
        files: [`${cs.packageDir}/**/*.{ts,tsx}`],
        rules: cs.controls.eslint.overrides,
        owner: cs.owner,
      });
    }
  }

  // Skip if no ESLint rules configured
  if (Object.keys(globalRules).length === 0) return [];

  // Build ESLint flat config
  const flatConfig: object[] = [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      plugins: { "react-refresh": reactRefresh },
    },
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          tsconfigRootDir: ctx.rootDir,
          project: path.resolve(ctx.rootDir, "tsconfig.base.json"),
        },
      },
      rules: globalRules,
    },
    // Per-package overrides
    ...overrideBlocks.map((block) => ({
      files: block.files,
      rules: block.rules,
    })),
  ];

  const eslint = new ESLint({
    cwd: ctx.rootDir,
    overrideConfigFile: true,
    overrideConfig: flatConfig,
    ignore: true,
  });

  // Resolve files
  const files: string[] = [];
  for (const pattern of ctx.allSourceGlobs) {
    const matches = await glob(pattern, {
      cwd: ctx.rootDir,
      ignore: ctx.ignorePatterns,
    });
    files.push(...matches);
  }

  const uniqueFiles = [...new Set(files)].map((f) => path.join(ctx.rootDir, f));
  if (uniqueFiles.length === 0) return [];

  const results = await eslint.lintFiles(uniqueFiles);

  // Normalize to LintViolation
  const violations: LintViolation[] = [];
  for (const result of results) {
    const relativeFile = path.relative(ctx.rootDir, result.filePath);

    for (const msg of result.messages) {
      violations.push({
        id: `eslint/${msg.ruleId ?? "unknown"}`,
        owner: "global",
        processor: "eslint",
        severity: eslintSeverityToOurs(msg.severity),
        file: relativeFile,
        lines: [msg.line],
        message: msg.message,
      });
    }
  }

  return violations;
}

function eslintSeverityToOurs(severity: number): Severity {
  if (severity === 2) return "error";
  if (severity === 1) return "warn";
  return "info";
}
