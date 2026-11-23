/** The caller's own profile, preferences and sign-in identifiers. */

import { queryOptions } from "@tanstack/react-query";
import { meApi } from "../api/me.api";

const keys = {
  me: ["uom", "me"] as const,
  preferences: ["uom", "preferences"] as const,
};

export const profileService = {
  keys,
  getProfile: () => queryOptions({ queryKey: keys.me, queryFn: () => meApi.getMe() }),
  getPreferences: () => queryOptions({ queryKey: keys.preferences, queryFn: () => meApi.getMyPreferences() }),
  updateProfile: meApi.updateProfile,
  presignAvatarUpload: meApi.presignAvatarUpload,
  updatePreferences: meApi.updateMyPreferences,
  addIdentifier: meApi.addIdentifier,
  verifyIdentifier: meApi.verifyIdentifier,
  removeIdentifier: meApi.removeIdentifier,
};
