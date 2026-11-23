// Theme Configuration
//
// Selects the active UI theme: one theme at one version, matching a folder
// under shared/libs/ui/themes/<theme>/v<version>/ — the theme engine compiles
// every theme@version to <that folder>/generated/ at build time, and the app
// wears exactly this one.

export const APP_THEME = { theme: "borro", version: 2 } as const;

/** the slices whose own concepts the theme wears: each path is a slice's theme file (it exports SLICE_CONCEPTS, and SLICE_EFFECTS when it has effects),
 *  from the repo root. A slice that leaves the product leaves this list, and its concepts leave the CSS. */
export const THEME_SLICE_ADDONS: readonly string[] = ["apps/main/slices/product/implementation-patterns/web/theme/index.ts", "slice-design/shared/ui/components/entity-previewers/theme/index.ts"];

/** the folder of the active theme's compiled CSS, relative to the repo root */
export const APP_THEME_DIR = `shared/libs/ui/themes/${APP_THEME.theme}/v${APP_THEME.version}/generated`;

/** the add-ons a theme wears: families of concepts that live outside the themes, so a project without them carries none of their CSS.
 *  `wholeFamily: true` turns every leaf of the family on; false, each leaf follows its own switch. */
export const THEME_ADDONS = {
  knowledge: {
    wholeFamily: true,
    familyLeafs: { canvas: true, codeBlock: false, table: false, noteSticker: true, explorationCard: true, explorationLink: false },
  },
} as const;
