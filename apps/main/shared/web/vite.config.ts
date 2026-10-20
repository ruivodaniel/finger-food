import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { APP_THEME, APP_THEME_DIR } from "../../../../configs/theme";
import { themeEditPlugin } from "./vite-plugins/theme-edit";
import { regenerateFixturesPlugin } from "./vite-plugins/regenerate-fixtures";
import { sandboxSnapshotPlugin } from "./vite-plugins/sandbox-snapshot";

// https://vite.dev/config/
// Note: TanStack Router file-based plugin removed — route tree is assembled
// programmatically in src/route-tree.ts for module-contributed routing.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    themeEditPlugin({
      themesDir: path.resolve(__dirname, "../../../../shared/libs/ui/themes"),
    }),
    regenerateFixturesPlugin(),
    sandboxSnapshotPlugin(),
  ],
  resolve: {
    // Dedupe peer-dep packages so workspace modules and the app share a single
    // module instance — prevents "No QueryClient set" / mismatched React contexts
    // when shared modules' loose peer ranges (^5.0.0) drift to a different
    // version than the apps' pinned versions.
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/react-router"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@theme-fonts": path.resolve(__dirname, `../../../../${APP_THEME_DIR}/${APP_THEME.theme}-fonts.css`),
      "@theme": path.resolve(__dirname, `../../../../${APP_THEME_DIR}/${APP_THEME.theme}.css`),
      "@configs/access-control": path.resolve(__dirname, "../../../../configs/access-control"),
      "@configs/brand": path.resolve(__dirname, "../../../../configs/brand"),
      "@configs/i18n": path.resolve(__dirname, "../../../../configs/i18n"),
      "@configs/product": path.resolve(__dirname, "../../../../configs/product"),
      "@configs/user-organization-mgmt": path.resolve(__dirname, "../../../../configs/user-organization-mgmt"),
      "@configs/list-query": path.resolve(__dirname, "../../../../configs/libs/list-query"),
      "@apps/api/hc": path.resolve(__dirname, "../api/src/lib/hc.ts"),
    },
  },

  // Pinned: the api's ALLOWED_ORIGINS and the invitation accept URLs address
  // this app at 5175. strictPort fails loudly instead of drifting to 5173 and
  // surfacing as a CORS error.
  server: {
    port: 5175,
    strictPort: true,
  },

  build: {
    chunkSizeWarningLimit: 1000,
  },
});
