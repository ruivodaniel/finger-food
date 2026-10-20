/**
 * Security service — TOTP enrollment + disable, backup codes, session step-up.
 *
 * Every method acts on the caller's OWN session token (from the cookie, never
 * in a response). Sequencing only; credential mechanics live in the port.
 */

import type { Private } from "@libs/gated-scoped-ac";
import type { SecurityStatusView } from "../../shared/types/domain";
import {
  IdentityProviderError,
  type IdentityProviderPort,
} from "../identity/identity-provider.port";
import type { ModuleErrors } from "../shared/module-errors";
import type { UserService } from "./user.service";

export interface SecurityServiceDeps {
  port: IdentityProviderPort;
  userService: Pick<UserService, "identityIdOf">;
  errors: ModuleErrors;
}

export class SecurityService {
  constructor(private readonly deps: SecurityServiceDeps) {}

  async status(
    visibility: Private,
    userId: string,
  ): Promise<SecurityStatusView> {
    const identityId = await this.deps.userService.identityIdOf(
      visibility,
      userId,
    );
    const identity = await this.deps.port.getIdentity(identityId);
    const types = identity.credentialTypes ?? [];
    return {
      totpEnrolled: types.includes("totp"),
      backupCodesGenerated: types.includes("lookup_secret"),
    };
  }

  /** Begin TOTP enrollment — returns the QR + secret for the caller to scan. */
  async startTotp(
    visibility: Private,
    sessionToken: string,
  ): Promise<{ flowId: string; totpSecret: string; qrDataUrl: string }> {
    void visibility; // no repo/service call to thread into — port only
    return this.deps.port.startTotpEnrollment(sessionToken);
  }

  /** Confirm TOTP with the first code, then hand back fresh backup codes. */
  async confirmTotp(
    visibility: Private,
    sessionToken: string,
    flowId: string,
    code: string,
  ): Promise<{ backupCodes: string[] }> {
    void visibility;
    try {
      await this.deps.port.confirmTotpEnrollment(sessionToken, flowId, code);
    } catch (e) {
      // Credential changes need a RECENT authentication (the provider's
      // privileged-session window) — that's not a wrong code, and saying so
      // sends the caller chasing their authenticator instead of re-signing-in.
      if (
        e instanceof IdentityProviderError &&
        e.kind === "reauthentication_required"
      ) {
        throw this.deps.errors.forbidden(
          "your sign-in is too old to change security settings — sign out, sign back in, then try again",
        );
      }
      throw this.deps.errors.badRequest("that code didn't match — try again");
    }
    const { codes } = await this.deps.port.generateBackupCodes(sessionToken);
    return { backupCodes: codes };
  }

  /** Regenerate backup codes (invalidates the old set). */
  async regenerateBackupCodes(
    visibility: Private,
    sessionToken: string,
  ): Promise<{ backupCodes: string[] }> {
    void visibility;
    const { codes } = await this.deps.port.generateBackupCodes(sessionToken);
    return { backupCodes: codes };
  }

  /** Raise the session to AAL2 with a TOTP or backup code. */
  async stepUp(
    visibility: Private,
    sessionToken: string,
    input: { code: string; method: "totp" | "backup_code" },
  ): Promise<void> {
    void visibility;
    try {
      if (input.method === "totp") {
        await this.deps.port.stepUpTotp(sessionToken, input.code);
      } else {
        await this.deps.port.stepUpBackupCode(sessionToken, input.code);
      }
    } catch {
      throw this.deps.errors.unauthorized("invalid code");
    }
  }

  /** Disable 2FA (the provider requires an AAL2 session — step up first). */
  async disableTotp(visibility: Private, sessionToken: string): Promise<void> {
    void visibility;
    try {
      await this.deps.port.disableTotp(sessionToken);
    } catch (e) {
      if (
        e instanceof IdentityProviderError &&
        e.kind === "reauthentication_required"
      ) {
        throw this.deps.errors.forbidden(
          "your sign-in is too old to change security settings — sign out, sign back in, then try again",
        );
      }
      throw this.deps.errors.forbidden(
        "confirm a code first to disable two-factor",
      );
    }
  }

  /** Sign out every other device (provider-native). The calling session survives. */
  async signOutOtherSessions(
    visibility: Private,
    sessionToken: string,
  ): Promise<void> {
    void visibility;
    await this.deps.port.revokeOtherSessions(sessionToken);
  }
}
