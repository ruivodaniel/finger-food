import { build } from "esbuild";
import pkg from "./package.json" with { type: "json" };

const externals = [
  ...Object.entries(pkg.dependencies || {})
    .filter(([, value]) => !value.includes("workspace:"))
    .map(([key]) => key),
  ...Object.keys(pkg.peerDependencies || {}),
];

await build({
  entryPoints: ["./src/**/*.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: ["node22"],
  outdir: "dist",
  sourcemap: true,
  outExtension: { ".js": ".js" },
  logLevel: "info",
  // `@/*` resolves from tsconfig.json paths (esbuild reads it); the
  // `@configs/*` bare specifiers need an explicit alias.
  alias: {
    "@configs/access-control": "../../../../configs/access-control/index.ts",
    "@configs/user-organization-mgmt": "../../../../configs/user-organization-mgmt",
  },
  external: externals,
});
