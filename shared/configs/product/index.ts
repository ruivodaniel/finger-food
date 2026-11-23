/**
 * @configs/product — product-level configuration that doesn't belong to
 * any single slice. Imported by the apps only: a slice never imports it —
 * the app injects the policy a slice needs at mount.
 */

export { PREFERENCES, type PreferencesConfig } from "./preferences.config";

export { HELP_CATALOG } from "./help-catalog.config";

export { NAVIGATION, type NavEntryConfig } from "./navigation.config";
