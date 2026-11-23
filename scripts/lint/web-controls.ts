// ── Web Controls ──────────────────────────────────────────────────
// The web structure and import boundaries (docs: Scaffolding & Import
// Boundaries, topics "Web: the core and every slice have fixed folders" and
// "Web: import boundaries"), built for one layout: lint-controls.ts uses it
// with this repo's web-layout.ts. Every rule runs in the web-boundaries
// processor, so the report shows them together.
//
// Severity is "warn" while the code is not in the target shape yet: the
// rules report the gap without failing lint:arch. `disabled` lists the rule
// ids switched off.

import type { Severity, WebBoundariesConfig, WebLayout } from "./types.ts";

export function webControls(layout: WebLayout, { severity = "warn", disabled = [] }: { severity?: Severity; disabled?: string[] } = {}): WebBoundariesConfig {
  const config: WebBoundariesConfig = {
    layout,
    shape: {
      core: { dirs: ["shells", "components", "services/api", "store", "config", "routes", "assets"], files: ["main.tsx", "env.ts"] },
      slice: { dirs: ["shared/layouts", "shared/components", "shared/hooks", "shared/helpers", "pages", "services/application", "services/api", "store", "routes"], files: ["index.ts"] },
      page: { dirs: ["components", "hooks", "helpers"], files: ["*Page.tsx"] },
    },
    rules: {
      // Imports
      "web-core-via-index": { severity, description: "Rule 2 · The core imports a slice only through its web/index.ts." },
      "web-slice-no-core": { severity, description: "Rule 3 · A slice never imports the core." },
      "web-slice-components-only": { severity, description: "Rule 4 · A slice imports another slice only through its web/index.ts, and only its shared/components, its services/application or a page it places in its own section; never its hooks." },
      "web-page-private": { severity, description: "Rule 6 · pages/<page>/ is private to that page; the slice's routes may import only the page file." },
      "web-api-only-from-application": { severity, description: "Rule 7 · Only services/application imports services/api." },
      "web-logic-via-application": { severity, description: "Rule 8 · Pages, components and hooks never call fetch: logic goes through services/application." },
      "web-store-no-raw-access": { severity, description: "Rules 9–10 · Only the store module touches raw state (getState/setState); everyone else uses the owner's named mutations." },
      "web-helpers-pure": { severity, description: "Rule 11 · Helpers import only helpers and node_modules packages." },
      "web-core-no-application": { severity, description: "Rule 12 · The core has no services/application, and its services/api knows no slice." },
      // Folder shape: every folder exists, even when empty (.gitkeep)
      "web-shape-core": { severity, description: "The core has every folder of its shape." },
      "web-shape-slice": { severity, description: "A slice's web has every folder of its shape." },
      "web-shape-page": { severity, description: "A page folder holds its page file and every folder of its shape." },
      "web-shape-pages-are-folders": { severity, description: "A page is a folder, pages/<page>/, never a file directly in pages/." },
    },
  };

  // Switch off what `disabled` names (the cockpit's toggles edit that list in lint-controls.ts).
  for (const [id, rule] of Object.entries(config.rules)) if (disabled.includes(id)) rule!.enabled = false;
  return config;
}
