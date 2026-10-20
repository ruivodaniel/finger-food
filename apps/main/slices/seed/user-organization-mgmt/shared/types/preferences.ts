/**
 * User preferences — the policy the app injects, the slice's storage
 * vocabulary, and the wire contract of /me/preferences.
 *
 * The slice never imports the product's config: the app hands its
 * preferences policy in at mount (API) and through the web config (UI), in
 * this shape.
 */

/** How a field resolves for a user: follow the system, or a pinned value. */
export const PREFERENCE_SOURCES = ["system", "explicit"] as const;
export type PreferenceSource = (typeof PREFERENCE_SOURCES)[number];

/** One preference field's product policy. */
export interface PreferenceFieldPolicy {
  /** The value when the user hasn't chosen one (or may not). */
  default: string;
  /** May users change it for themselves? */
  userOverridable: boolean;
  /** Does the product offer "follow the system" for it? */
  allowSystemBinding: boolean;
  /** Allowed values, or "all" (any value the value-types lib accepts). */
  supported: readonly string[] | "all";
}

export interface PreferencesPolicy {
  locale: PreferenceFieldPolicy;
  timezone: PreferenceFieldPolicy;
  currency: PreferenceFieldPolicy;
  country: PreferenceFieldPolicy;
}

export type PreferenceField = keyof PreferencesPolicy;
/** Fields the system can resolve — a source plus a value. */
export type BoundPreferenceField = "locale" | "timezone";
/** Fields that are a plain value. */
export type ValuePreferenceField = "currency" | "country";

/** Effective preferences — the user's choices over the product's defaults. */
export interface UserPreferencesView {
  /** value is null while following the system (the client resolves it). */
  locale: { source: PreferenceSource; value: string | null };
  timezone: { source: PreferenceSource; value: string | null };
  currency: string | null;
  country: string | null;
}

export type BoundPreferenceInput =
  | { source: "system" }
  | { source: "explicit"; value: string };

export interface UpdateUserPreferencesInput {
  locale?: BoundPreferenceInput;
  timezone?: BoundPreferenceInput;
  /** null clears the override (back to the product default). */
  currency?: string | null;
  country?: string | null;
}
