// Theme Configuration
//
// Selects the active UI theme: one theme at one version, matching a folder
// under shared/libs/ui/themes/<theme>/v<version>/ — the theme engine compiles
// every theme@version to <that folder>/generated/ at build time, and the app
// wears exactly this one.

export const APP_THEME = { theme: "wireframe-stroke", version: 1 } as const;

/** the folder of the active theme's compiled CSS, relative to the repo root */
export const APP_THEME_DIR = `shared/libs/ui/themes/${APP_THEME.theme}/v${APP_THEME.version}/generated`;
