/**
 * The sections of this slice that a navigation shows: declared once, read by the route tree (get-routes.ts) and by the layouts
 * that draw them (SettingsLayout › SettingsNav, StandardLayout's title band). Routing carries no icon: icons are each
 * navigation's own dictionary, by path.
 */
import type { IconName } from "@libs/web-components";

/** The caller's settings: the base path and the children a page may hang under it. */
export const SETTINGS_BASE_PATH = "/my/settings";

/** The pages that stand alone under the sidebar shell, by absolute path: what their title band shows. */
export const STANDALONE_PAGE_HEADERS: Record<string, { title: string; icon: IconName }> = {
  "/": { title: "Home", icon: "home" },
  "/resolve": { title: "Account setup", icon: "lock" },
  "/my/memberships": { title: "My memberships", icon: "building" },
  "/my/invitations": { title: "My invitations", icon: "mail" },
  "/organizations": { title: "Organizations", icon: "building" },
};
