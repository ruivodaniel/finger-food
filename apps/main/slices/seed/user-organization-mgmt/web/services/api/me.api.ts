import type { UserView } from "../../../shared/types/domain";
import type { UpdateUserPreferencesInput, UserPreferencesView } from "../../../shared/types/preferences";
import { clientUrl, post, request } from "./http";

type IdentifierType = "email" | "phone";

export const meApi = {
  getMe: (): Promise<UserView> => request(clientUrl("/me")),
  updateProfile: (body: { name?: string; image?: string; data?: Record<string, unknown> }): Promise<UserView> =>
    request(clientUrl("/me/profile"), { method: "PATCH", body: JSON.stringify(body) }),
  presignAvatarUpload: (body: { contentType: string }): Promise<{ uploadUrl: string; publicUrl: string }> =>
    post(clientUrl("/me/profile/avatar-upload"), body),
  getMyPreferences: (): Promise<UserPreferencesView> => request(clientUrl("/me/preferences")),
  updateMyPreferences: (patch: UpdateUserPreferencesInput): Promise<UserPreferencesView> =>
    request(clientUrl("/me/preferences"), { method: "PATCH", body: JSON.stringify(patch) }),
  addIdentifier: (body: { type: IdentifierType; value: string }): Promise<{ verificationFlowId: string }> =>
    post(clientUrl("/me/identifiers"), body),
  verifyIdentifier: (body: { flowId: string; code: string; type: IdentifierType; value: string }): Promise<UserView> =>
    post(clientUrl("/me/identifiers/verify"), body),
  removeIdentifier: (body: { type: IdentifierType; value: string }): Promise<UserView> =>
    request(clientUrl("/me/identifiers"), { method: "DELETE", body: JSON.stringify(body) }),
};
