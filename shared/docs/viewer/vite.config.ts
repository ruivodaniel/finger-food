// The docs viewer: a Vite app that imports the UI library from shared/libs (never copied) and serves the database beside it (shared/docs/db) under /db/.
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve, join, extname } from "node:path";
import { existsSync, statSync, createReadStream } from "node:fs";

export const PORT = 8902;
const HERE = __dirname;                       // shared/docs/viewer
const DB = resolve(HERE, "../db");            // shared/docs/db
const MOUNT = resolve(HERE, "../../..");      // the repo
const LIB = resolve(MOUNT, "shared/libs/ui");

const MIME: Record<string, string> = { ".json": "application/json", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".css": "text/css", ".js": "text/javascript" };
/** /db/<path> → shared/docs/db/<path>, read-only */
const serveDb = (): Plugin => ({
  name: "docs-db",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = (req.url ?? "").split("?")[0];
      if (!url.startsWith("/db/")) return next();
      const file = join(DB, decodeURIComponent(url.slice(4)));
      if (!file.startsWith(DB) || !existsSync(file) || !statSync(file).isFile()) { res.statusCode = 404; res.end("not found"); return; }
      res.setHeader("Content-Type", MIME[extname(file)] ?? "application/octet-stream");
      res.setHeader("Cache-Control", "no-store");
      createReadStream(file).pipe(res);
    });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), serveDb()],
  publicDir: false,
  resolve: {
    // one React: the libraries carry their own node_modules; every copy resolves to this app's
    dedupe: ["react", "react-dom"],
    alias: [
      // the code block previewer (shared/libs/knowledge): CodeMirror is this app's
      { find: "@libs/knowledge/previewer-editors", replacement: resolve(MOUNT, "shared/libs/knowledge/previewer-editors") },
      { find: /^@codemirror\/(.*)$/, replacement: resolve(HERE, "node_modules/@codemirror") + "/$1" },
      { find: /^@lezer\/highlight$/, replacement: resolve(HERE, "node_modules/@lezer/highlight") },
      { find: /^react$/, replacement: resolve(HERE, "node_modules/react") },
      { find: /^react\/jsx-runtime$/, replacement: resolve(HERE, "node_modules/react/jsx-runtime") },
      { find: /^react-dom$/, replacement: resolve(HERE, "node_modules/react-dom") },
      { find: /^react-dom\/client$/, replacement: resolve(HERE, "node_modules/react-dom/client") },
      // the libraries, as slice-design's live viewer imports them
      { find: "@libs/web-components-src", replacement: resolve(LIB, "web/primitives/components") },
      { find: "@libs/web-components", replacement: resolve(LIB, "web/index.ts") },
      { find: "@libs/web-layouts", replacement: resolve(LIB, "web/primitives/layouts/index.ts") },
      { find: "@libs/value-types", replacement: resolve(MOUNT, "shared/libs/value-types/src/index.ts") },
      { find: "@libs/ui-types", replacement: resolve(LIB, "types/index.ts") },
      // the one theme: wireframe-stroke v1 (Daniel, 2 Nov); the default theme authors no list-tree rows
      { find: "@theme-fonts", replacement: resolve(LIB, "themes/borro/v1/generated/borro-fonts.css") },
      { find: "@theme", replacement: resolve(LIB, "themes/borro/v1/generated/borro.css") },
    ],
  },
  cacheDir: resolve(HERE, "node_modules/.vite-docs"),
  server: { port: PORT, strictPort: true, fs: { allow: [MOUNT] } },
});
