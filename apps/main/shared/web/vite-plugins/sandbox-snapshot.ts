/**
 * Vite dev plugin — POST /__api/sandbox-snapshot
 *
 * The ONLY job of this plugin is to spawn `scripts/sandbox-snapshot.mts`
 * as a separate process. Playwright runs in that process, hits
 * http://localhost:5173 like an e2e test, writes HTML files. The dev
 * server is just a webserver to it. No app code runs inside the plugin.
 *
 * Mirror of `regenerate-fixtures.ts` — same shape, different script.
 *
 * Optional query params:
 *   ?cast=<id>   — only that cast's pages (or "incognito")
 *   ?id=<id>     — only that single page
 *
 * Dev-only — never registered in production builds.
 */

import type { Plugin } from "vite";
import { spawn } from "node:child_process";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

export function sandboxSnapshotPlugin(): Plugin {
  return {
    name: "sandbox-snapshot",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(
        "/__api/sandbox-snapshot",
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== "POST") {
            return sendJson(res, 405, { error: "POST only" });
          }
          try {
            const url = new URL(req.url ?? "/", "http://x");
            const flags: string[] = [];
            const id = url.searchParams.get("id");
            const cast = url.searchParams.get("cast");
            if (id) flags.push(`--id=${id}`);
            if (cast) flags.push(`--cast=${cast}`);
            const result = await runScript(flags);
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

function runScript(args: string[]): Promise<{ ok: true; stdout: string; stderr: string }> {
  // __dirname here is apps/main/web/vite-plugins; cwd one level up.
  const appCwd = path.resolve(__dirname, "..");

  return new Promise((resolve, reject) => {
    // Spawn via the same `pnpm sandbox:snapshot` script path that works
    // from a terminal — avoids `npx`/PATH resolution flakiness in vite's
    // child-process environment.
    // nosemgrep: javascript.lang.security.audit.spawn-shell-true.spawn-shell-true
    const child = spawn("pnpm", ["sandbox:snapshot", ...args], {
      cwd: appCwd,
      // shell: true makes `pnpm` resolvable through the user's PATH the
      // same way as in their terminal.
      shell: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => {
      const s = d.toString();
      stdout += s;
      // Tee to dev-server console so failures aren't black-boxed.
      process.stdout.write(`[sandbox-snapshot] ${s}`);
    });
    child.stderr.on("data", (d: Buffer) => {
      const s = d.toString();
      stderr += s;
      process.stderr.write(`[sandbox-snapshot] ${s}`);
    });
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve({ ok: true, stdout, stderr });
      } else {
        reject(
          new Error(
            `sandbox-snapshot exited with code ${code}: ${stderr || stdout || "(no output)"}`,
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
