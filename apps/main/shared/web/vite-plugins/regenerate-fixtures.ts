/**
 * Vite dev plugin — POST /__api/regenerate-fixtures
 *
 * Spawns `scripts/build-fixtures.mjs` (the same script `pnpm theme:fixtures`
 * runs) and returns its stdout/stderr. Triggered by the editor's fixture
 * actions menu so designers can refresh fixtures without leaving the page.
 *
 * Dev-only — never registered in production builds.
 */

import type { Plugin } from "vite";
import { spawn } from "node:child_process";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

export function regenerateFixturesPlugin(): Plugin {
  return {
    name: "regenerate-fixtures",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(
        "/__api/regenerate-fixtures",
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== "POST") {
            return sendJson(res, 405, { error: "POST only" });
          }
          try {
            const result = await runFixtureScript();
            return sendJson(res, 200, result);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return sendJson(res, 500, { error: message });
          }
        },
      );
    },
  };
}

function runFixtureScript(): Promise<{
  ok: true;
  stdout: string;
  stderr: string;
}> {
  // __dirname is apps/main/web/vite-plugins; script lives one level up.
  const appCwd = path.resolve(__dirname, "..");
  const scriptPath = path.resolve(appCwd, "scripts/build-fixtures.mjs");

  return new Promise((resolve, reject) => {
    const child = spawn("node", [scriptPath], { cwd: appCwd });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve({ ok: true, stdout, stderr });
      } else {
        reject(
          new Error(
            `build-fixtures.mjs exited with code ${code}: ${stderr || stdout || "(no output)"}`,
          ),
        );
      }
    });
    child.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
