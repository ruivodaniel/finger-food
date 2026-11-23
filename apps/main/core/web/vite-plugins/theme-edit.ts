/**
 * Vite dev plugin — POST /__api/theme-edit
 *
 * Receives `{ themeId, version, theme }` from the theme editor and writes
 * the theme back to `<themesDir>/<themeId>/v<version>/theme.ts` — the
 * versioned source the engine compiles. Preserves the file's existing
 * import line and `export const <name>` identifier when present, so
 * re-saving doesn't churn unrelated structure.
 *
 * Dev-only — never registered in production builds.
 */

import type { Plugin } from "vite";
import path from "node:path";
import fs from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import * as prettier from "prettier";

const THEME_ID_RE = /^[a-zA-Z0-9_-]+$/;

const PRETTIER_OPTIONS: prettier.Options = {
  parser: "typescript",
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  tabWidth: 2,
  printWidth: 120,
};

type Options = {
  /** Absolute path to the directory containing `<themeId>.ts` files. */
  themesDir: string;
};

export function themeEditPlugin({ themesDir }: Options): Plugin {
  const root = path.resolve(themesDir);

  return {
    name: "theme-edit",
    apply: "serve", // dev-only
    configureServer(server) {
      server.middlewares.use("/__api/theme-edit", async (req, res) => {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "POST only" });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const { themeId, version, theme } = body as {
            themeId?: unknown;
            version?: unknown;
            theme?: unknown;
          };

          if (typeof themeId !== "string" || !THEME_ID_RE.test(themeId)) {
            return sendJson(res, 400, { error: "invalid themeId" });
          }
          if (!Number.isInteger(version) || (version as number) < 1) {
            return sendJson(res, 400, { error: "version must be a positive integer" });
          }
          if (!theme || typeof theme !== "object") {
            return sendJson(res, 400, { error: "missing theme object" });
          }
          const themeObj = theme as Record<string, unknown>;
          if (themeObj.id !== themeId) {
            return sendJson(res, 400, {
              error: `theme.id (${String(themeObj.id)}) does not match themeId (${themeId})`,
            });
          }

          const versionDir = path.resolve(root, themeId, `v${version as number}`);
          const filePath = path.join(versionDir, "theme.ts");
          // Prevent path traversal
          if (!filePath.startsWith(root + path.sep)) {
            return sendJson(res, 400, { error: "path traversal blocked" });
          }
          await fs.mkdir(versionDir, { recursive: true });

          // Read existing file (if any) to preserve import line + export name
          let importLine = `import type { Theme } from "../../../types";`;
          let exportName = `${themeId.replace(/[-_]/g, "")}Theme`;
          try {
            const existing = await fs.readFile(filePath, "utf-8");
            const importMatch = existing.match(
              /^import\s+type\s+\{\s*Theme[^}]*\}\s+from\s+["'][^"']+["'];?/m,
            );
            if (importMatch) importLine = importMatch[0];
            const exportMatch = existing.match(
              /export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*Theme/,
            );
            if (exportMatch) exportName = exportMatch[1]!;
          } catch {
            // File may not exist yet — use defaults
          }

          // Build raw source (prettier will tidy it)
          const themeJson = JSON.stringify(themeObj, null, 2);
          const raw = `${importLine}\n\nexport const ${exportName}: Theme = ${themeJson};\n`;

          const formatted = await prettier.format(raw, PRETTIER_OPTIONS);
          await fs.writeFile(filePath, formatted, "utf-8");

          return sendJson(res, 200, {
            ok: true,
            path: path.relative(process.cwd(), filePath),
            exportName,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return sendJson(res, 500, { error: message });
        }
      });
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf-8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
