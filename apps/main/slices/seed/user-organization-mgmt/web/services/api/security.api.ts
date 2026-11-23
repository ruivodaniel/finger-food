import type { SecurityStatusView } from "../../../shared/types/domain";
import { clientUrl, post, request } from "./http";

export const securityApi = {
  getSecurityStatus: (): Promise<SecurityStatusView> => request(clientUrl("/me/security")),
  enrollTotp: (): Promise<{ flowId: string; totpSecret: string; qrDataUrl: string }> =>
    post(clientUrl("/me/security/totp/enroll")),
  confirmTotp: (body: { flowId: string; code: string }): Promise<{ backupCodes: string[] }> =>
    post(clientUrl("/me/security/totp/confirm"), body),
  regenerateBackupCodes: (): Promise<{ backupCodes: string[] }> => post(clientUrl("/me/security/backup-codes")),
  securityStepUp: (body: { code: string; method: "totp" | "backup_code" }): Promise<void> =>
    post(clientUrl("/me/security/step-up"), body),
  disableTotp: (): Promise<void> => post(clientUrl("/me/security/totp/disable")),
  revokeOtherSessions: (): Promise<void> => post(clientUrl("/me/security/sessions/revoke-others")),
};
