import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

interface ValidationError {
  file: string;
  rule: string;
  message: string;
}

const errors: ValidationError[] = [];

// Not runtime code. Archived trees and design explorations carry the OLD
// scaffolding by definition — validating them against the new one is noise.
const IGNORE = [
  "node_modules/**",
  "**/node_modules/**",
  "**/dist/**",
  "_archive/**",
  "slice-design/**",
  "_meta/**",
  "_reference/**",
  "**/.trigger/**",
  "**/.venv/**",
];

console.log("🔍 Validating scaffolding rules...\n");

// RULE 1: No root-level types folder
const rootTypes = await glob("types/**/*.ts");
if (rootTypes.length > 0) {
  rootTypes.forEach((file) => {
    errors.push({
      file,
      rule: "no-root-types",
      message: "Types must live with their domain, not at root level",
    });
  });
}

// RULE 2: Types must be in recognized locations
const allTypeFiles = await glob("**/types/**/*.ts", { ignore: IGNORE });

// Recognized homes under the target scaffolding (target-scaffolding.md).
const validTypePaths = [
  // A slice's cross-tier types — the canonical home.
  /^apps\/main\/slices\/(?:seed|product)\/[^/]+\/shared\/types\//,
  // A slice's tier-local types.
  /^apps\/main\/slices\/(?:seed|product)\/[^/]+\/(?:api|web|mobile)\/types\//,
  // Main's shells.
  /^apps\/main\/(?:api|web|mobile)\/src\/types\//,
  // Any other app.
  /^apps\/[^/]+\/src\/types\//,
  // Generic engines. shared/libs/ui keeps its type surface at the package root
  // because it is consumed as a type-only package by the theme engine.
  /^shared\/libs\/[^/]+\/src\/types\//,
  /^shared\/libs\/ui\/types\//,
  // Pure data.
  /^configs\/(?:libs\/)?[^/]+\/.*types\//,
  // Tooling.
  /^team-cockpit\/.*\/types\//,
  /^tools\/[^/]+\/src\/types\//,
];

allTypeFiles.forEach((file) => {
  const isValid = validTypePaths.some((pattern) => pattern.test(file));
  if (!isValid) {
    errors.push({
      file,
      rule: "types-location",
      message: "Types file in unrecognized location",
    });
  }
});

// RULE 3: No cross-app imports
// "NOBODY may import another app's code" (target-scaffolding.md § Import
// boundaries). apps/main/{api,web,mobile} + apps/main/slices/** are all one
// app — "main" — so only imports that cross an app root count.
const appFiles = await glob(
  [
    "apps/*/src/**/*.{ts,tsx}",
    "apps/main/*/src/**/*.{ts,tsx}",
    "apps/main/slices/*/*/**/*.{ts,tsx}",
    // The orchestrator has no src/: its app root holds shared/ and slices/.
    "apps/orchestrator/{shared,slices}/**/*.{ts,tsx}",
  ],
  { ignore: IGNORE },
);

/** apps/main/shared/api/src/x.ts → "main"; apps/orchestrator/shared/x.ts → "orchestrator" */
function appOf(p: string): string | null {
  const m = p.match(/^apps\/([^/]+)\//);
  return m ? m[1] : null;
}

/** Package specifier → app name. @apps/api and @apps/web-main are main's shells. */
function appOfSpecifier(spec: string): string | null {
  const m = spec.match(/^@apps\/([^/]+)/);
  if (!m) return null;
  return m[1] === "api" || m[1] === "web-main" ? "main" : m[1];
}

appFiles.forEach((file) => {
  const ownApp = appOf(file);
  if (!ownApp) return;
  const content = fs.readFileSync(file, "utf-8");

  for (const m of content.matchAll(/(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    // Bare package specifier into another app.
    const specApp = appOfSpecifier(spec);
    // Relative path that walks up into a different app root.
    const relApp = spec.startsWith(".")
      ? appOf(path.posix.normalize(path.posix.join(path.posix.dirname(file), spec)))
      : null;

    const target = specApp ?? relApp;
    if (target && target !== ownApp) {
      errors.push({
        file,
        rule: "no-cross-app-imports",
        message: `Apps cannot import from other apps — "${spec}" reaches app "${target}" from "${ownApp}". Apps talk over the wire, never by import.`,
      });
      break;
    }
  }
});

// RULE 4: No imports from non-runtime folders into runtime code
// Runtime code (shared/, apps/, team-cockpit/, libs/, tools/) cannot import from exploration/migration folders
const runtimeFiles = await glob("{shared,apps,team-cockpit,libs,tools}/**/*.{ts,tsx}", {
  ignore: IGNORE,
});

const nonRuntimeFolders = [
  "agents-os/",
  "______to_migrate/",
  "___migrated/",
];

runtimeFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8");
  
  for (const folder of nonRuntimeFolders) {
    // Check for imports from these folders (various import patterns)
    const importPatterns = [
      new RegExp(`from\\s+['"][^'"]*${folder.replace("/", "\\/")}`, "g"),
      new RegExp(`import\\s*\\([^)]*['"][^'"]*${folder.replace("/", "\\/")}`, "g"),
      new RegExp(`require\\s*\\([^)]*['"][^'"]*${folder.replace("/", "\\/")}`, "g"),
    ];
    
    for (const pattern of importPatterns) {
      if (pattern.test(content)) {
        errors.push({
          file,
          rule: "no-non-runtime-imports",
          message: `Runtime code cannot import from ${folder} (exploration/migration folder)`,
        });
        break;
      }
    }
  }
});

// RULE 5: Business domain code belongs in a slice
// Under the target scaffolding a business domain IS a slice — there is no
// separate business/ zone. Anything named business/ outside a slice is misplaced.
const businessDomainOutsideSlices = await glob("**/business/**/*.ts", {
  ignore: [...IGNORE, "apps/main/slices/*/*/**"],
});

businessDomainOutsideSlices.forEach((file) => {
  errors.push({
    file,
    rule: "business-domain-location",
    message: "Business domain code must live in a slice — apps/main/slices/{seed,product}/<slice>/",
  });
});

// OUTPUT
if (errors.length > 0) {
  console.error("❌ Scaffolding validation failed:\n");
  errors.forEach((e) => {
    console.error(`  ${e.file}`);
    console.error(`    Rule: ${e.rule}`);
    console.error(`    ${e.message}\n`);
  });
  process.exit(1);
} else {
  console.log("✅ Scaffolding validation passed");
  process.exit(0);
}
