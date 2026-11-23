import type { AuthConfigView } from "../../../shared/types/flows";
import type { SessionView, UserView } from "../../../shared/types/domain";
import { authUrl, post, request } from "./http";

export interface SessionResponse {
  user: UserView | null;
  session: SessionView | null;
}

/**
 * Every credential proof signs the caller in. 2FA is the GATE's demand: a
 * TOTP-enrolled member is 428-blocked at AAL1 and steps up on the live
 * session (/me/security/step-up), like any other obligation.
 */
export type LoginResponse = UserView;

/**
 * Registration always answers "code sent" — nothing exists until
 * `registerVerify` proves the delivered code, which births the account with
 * its address verified (and its password set, when the config collects one).
 */
export type RegisterResponse = { codeSent: true; flowId: string };

/** What `registerVerify` answers: the account is born and signed in. */
export type RegisterVerifyResponse = { user: UserView };

type Identifier = { identifierType: string; identifierValue: string };
type Consents = Array<{ type: string; accepted: boolean }>;

export const authApi = {
  getAuthConfig: (query: {
    intent: "registration" | "authentication" | "recovery";
    identifier?: string;
  }): Promise<AuthConfigView> =>
    request(authUrl(`/config?intent=${query.intent}${query.identifier ? `&identifier=${query.identifier}` : ""}`)),
  /**
   * Start a registration: the form's data is policy-checked and a code is
   * delivered. Nothing exists yet — the whole form (password included) stays
   * in client state and rides `registerVerify`, the request that births the
   * account.
   */
  register: (
    body: Identifier & { password?: string; name?: string; consents?: Consents; invitationId?: string },
  ): Promise<RegisterResponse> => post(authUrl("/register"), body),
  registerVerify: (
    body: Identifier & {
      flowId: string;
      code: string;
      name?: string;
      password?: string;
      consents?: Consents;
      invitationId?: string;
    },
  ): Promise<RegisterVerifyResponse> => post(authUrl("/register/verify"), body),
  loginPassword: (body: Identifier & { password: string }): Promise<LoginResponse> => post(authUrl("/login"), body),
  loginCodeStart: (body: Identifier): Promise<{ flowId: string }> => post(authUrl("/login/code/start"), body),
  loginCodeComplete: (body: Identifier & { flowId: string; code: string }): Promise<LoginResponse> =>
    post(authUrl("/login/code/complete"), body),
  recoveryStart: (body: Identifier): Promise<{ flowId: string }> => post(authUrl("/recovery/start"), body),
  /** Proving the code signs the caller in — it IS a credential proof. */
  recoveryComplete: (body: Identifier & { flowId: string; code: string }): Promise<UserView> =>
    post(authUrl("/recovery/complete"), body),
  /** Signed-in: sets the password and revokes EVERY session, this one included. */
  recoveryFinish: (body: { newPassword: string; identifierType?: string }): Promise<void> =>
    post(authUrl("/recovery/finish"), body),
  getSession: (): Promise<SessionResponse> => request(authUrl("/session")),
  logout: (): Promise<void> => post(authUrl("/logout")),
};
