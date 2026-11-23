// ── Web Layout ────────────────────────────────────────────────────
// Where the web lives in this repo. The web-boundaries processor classifies
// every file and every import target against it.

import type { WebLayout } from "./types.ts";

const layout: WebLayout = {
  core: "apps/main/core/web/src",
  slices: ["apps/main/slices/*/*/web"],
  aliases: [
    { pattern: "^@/(.*)$", to: ["apps/main/core/web/src/$1"] },
    { pattern: "^@modules/shared/web(/.*)?$", to: ["apps/main/slices/shared/web$1"] },
    { pattern: "^@modules/([^/]+)/web(/.*)?$", to: ["apps/main/slices/seed/$1/web$2", "apps/main/slices/product/$1/web$2"] },
    { pattern: "^@seed/([^/]+)/web(/.*)?$", to: ["apps/main/slices/seed/$1/web$2"] },
    { pattern: "^@product/([^/]+)/web(/.*)?$", to: ["apps/main/slices/product/$1/web$2"] },
  ],
};

export default layout;
