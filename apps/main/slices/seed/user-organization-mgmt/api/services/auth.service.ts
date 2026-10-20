/**
 * Auth service — credential flows relayed onto the provider's own flows.
 *
 * No flow table, no session table: the provider owns the conversation, the
 * client holds the flow id. The module adds product policy (the config), the
 * app's user row, consent + profile records, and uniform errors.
 *
 * Any successful credential proof signs the caller in. No login-time 2FA
 * branch — TOTP is enforced by THE GATE via membership rules (step-up at
 * /me/security/step-up).
 *
 * Existence masking: `loginCodeStart` and `recoveryStart` always answer with
 * a flow id — a DECOY when the provider refused (unknown identifier, Kratos
 * error 4000035) — so accounts can't be enumerated. A decoy fails at submit
 * like any wrong code.
 *
 * Every registration is a code registration: the identity is born when the
 * code proves out, address verified from birth. A configured password rides
 * the verify request and is SET on the fresh session — never the registration
 * credential. The gate backstops identifiers added after birth
 * (see gate.service.ts).
 */

import { randomUUID } from "node:crypto";
import type { Public } from "@libs/gated-scoped-ac";

import {
  factorKey,
  resolveFactors,
  resolveIdentifiers,
  resolveObligations,
} from "../../shared/auth-config/resolver";
import type {
  AuthAndRegistrationConfig,
  IdentifierName,
} from "../../shared/auth-config/types";
import type { AuthConfigView } from "../../shared/types/flows";
import type { UserOrgMgmtHooks } from "../../shared/types/hooks";
import {
  IdentityProviderError,
  type IdentityProviderPort,
  type IdentityTraits,
  type SessionSnapshot,
} from "../identity/identity-provider.port";
import type { ConsentDecision, ConsentRecordService } from "./consent-record.service";
import type { UserService } from "./user.service";
import {
  consentItemsOf,
  dedupeObligations,
  requiredDataFields,
} from "../shared/obligation-helpers";
import { passwordPolicyProblems } from "../../shared/auth-config/password-policy";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";

export interface Identifier {
  type: IdentifierName;
  value: string;
}

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

/** Everything the client may hand over in the one registration request. */
export interface RegistrationInput {
  identifier: Identifier;
  password?: string;
  name?: string;
  consents?: ConsentDecision[];
  /** Required only when the product forbids spontaneous signup. */
  invitationId?: string;
}

/** Registration's only answer: the code was delivered; nothing exists yet. */
export interface RegistrationStarted {
  flowId: string;
}

export interface LoginResult {
  sessionToken: string;
  userId: string;
}

export interface AuthServiceDeps {
  authConfig: AuthAndRegistrationConfig;
  port: IdentityProviderPort;
  userService: Pick<UserService, "findOrCreateByIdentityId" | "updateProfile">;
  consentRecordService: Pick<ConsentRecordService, "recordConsent">;
  hooks: UserOrgMgmtHooks;
  errors: ModuleErrors;
  logger: ModuleLogger;
  socialProviders: { google: boolean; apple: boolean };
}

const viaOf = (type: IdentifierName): "email" | "sms" =>
  type === "phone" ? "sms" : "email";

export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  /** Derived auth options for a screen — the raw config never reaches a client.
   * AC42: Public — every method on this service is a direct entry point of the
   * pre-session credential surface; none reaches a further token-demanding
   * call (the registration/login self-heal chain it delegates into is
   * token-less infrastructure, rule 5), so `visibility` is accepted but unused. */
  authConfigView(
    visibility: Public,
    input: {
      intent: "registration" | "authentication" | "recovery";
      identifier?: IdentifierName;
    },
  ): AuthConfigView {
    void visibility;
    const ctx = { intent: input.intent, identifier: input.identifier };
    const obligations = dedupeObligations(
      resolveObligations(this.deps.authConfig, ctx),
    );
    const factorSpecs = resolveFactors(this.deps.authConfig, ctx);
    return {
      identifiers: resolveIdentifiers(this.deps.authConfig, ctx),
      factors: [...new Set(factorSpecs.map(factorKey))],
      passwordPolicy:
        factorSpecs.find((f) => f.method === "password")?.config ?? null,
      allowSpontaneousAccountCreation:
        this.deps.authConfig.allowSpontaneousAccountCreation,
      socialProviders: this.deps.socialProviders,
      consent: consentItemsOf(obligations),
      profileFields: requiredDataFields(obligations),
    };
  }

  // ── Registration ───────────────────────────────────────────────────────────

  /**
   * Start a registration: gauntlet (fast form feedback), then deliver the
   * code. The authoritative gauntlet run is `registerVerify`'s.
   */
  async register(
    visibility: Public,
    input: RegistrationInput,
  ): Promise<RegistrationStarted> {
    void visibility;
    const { identifier } = input;
    await this.assertRegistrationGauntlet(identifier.type, input);

    // Nothing exists yet — the provider holds the traits until the code
    // proves out; the password stays with the client until verify.
    try {
      const { flowId } = await this.deps.port.startCodeRegistration(
        this.traitsFor(identifier, input.name),
      );
      return { flowId };
    } catch (error) {
      throw this.mapProviderError(error);
    }
  }

  /**
   * Finish a registration: the code proof births the identity, address
   * verified. The gauntlet re-runs BEFORE birth. After birth, failures
   * degrade instead of stranding — the account stands; the gate collects
   * what's missing at /resolve.
   */
  async registerVerify(
    visibility: Public,
    input: {
      flowId: string;
      identifier: Identifier;
      code: string;
      name?: string;
      password?: string;
      consents?: ConsentDecision[];
      invitationId?: string;
    },
    meta: RequestMeta = {},
  ): Promise<LoginResult> {
    void visibility;
    await this.assertRegistrationGauntlet(input.identifier.type, input);

    const traits = this.traitsFor(input.identifier, input.name);
    let registered;
    try {
      registered = await this.deps.port.submitCodeRegistration(
        input.flowId,
        traits,
        input.code,
      );
    } catch (error) {
      throw this.mapVerifyError(error);
    }

    if (input.password) {
      try {
        // Settings write on the fresh code-proof session (privileged by recency).
        await this.deps.port.setPassword(
          registered.sessionToken,
          input.password,
        );
      } catch (error) {
        if (
          error instanceof IdentityProviderError &&
          error.kind === "policy_violation"
        ) {
          const rolledBack = await this.deps.port
            .deleteIdentity(registered.identityId)
            .then(() => true)
            .catch((rollbackError) => {
              this.deps.logger.error(
                "birth rollback failed — account stands passwordless",
                { identityId: registered.identityId, rollbackError },
              );
              return false;
            });
          if (rolledBack) throw this.deps.errors.badRequest(error.message);
        } else {
          this.deps.logger.error(
            "password not set at birth — account stands passwordless",
            { identityId: registered.identityId, error },
          );
        }
      }
    }

    const userId = await this.seatUser(registered.identityId, input, meta);
    return {
      sessionToken: registered.sessionToken,
      userId,
    };
  }

  /** Config demands for a registration — at start (form feedback) and at verify (enforcement). */
  private async assertRegistrationGauntlet(
    type: IdentifierName,
    input: { name?: string; password?: string; invitationId?: string },
  ): Promise<void> {
    this.assertRegistrationIdentifier(type);
    await this.assertSignupAllowed(input.invitationId);
    this.assertRequiredProfile(type, input.name);
    if (this.registrationCollectsPassword(type)) {
      if (!input.password) {
        throw this.deps.errors.badRequest(
          `registering with "${type}" requires a password`,
        );
      }
      this.assertPasswordPolicy(type, input.password);
    } else if (input.password) {
      throw this.deps.errors.badRequest(
        `"${type}" registers without a password`,
      );
    }
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  /** Password login. Any failure is the same 401 — nothing leaks. */
  async loginWithPassword(
    visibility: Public,
    input: {
      identifier: Identifier;
      password: string;
    },
  ): Promise<LoginResult> {
    void visibility;
    this.assertLoginFactor(input.identifier.type, "password");
    let login;
    try {
      login = await this.deps.port.loginPassword(
        input.identifier.value,
        input.password,
      );
    } catch {
      throw this.deps.errors.unauthorized("invalid credentials");
    }
    return this.finishLogin(login);
  }

  /** OTP login, step 1. Always answers a flow id — decoy on refusal (masking). */
  async loginCodeStart(
    visibility: Public,
    input: {
      identifier: Identifier;
    },
  ): Promise<{ flowId: string }> {
    void visibility;
    this.assertLoginFactor(input.identifier.type, "otp");
    try {
      return await this.deps.port.startCodeLogin(input.identifier.value);
    } catch (error) {
      this.deps.logger.info("code login start failed (masked)", {
        kind: error instanceof IdentityProviderError ? error.kind : "unknown",
      });
      return { flowId: randomUUID() }; // decoy — fails at submit like a bad code
    }
  }

  /** OTP login, step 2. A decoy flow id fails here exactly like a wrong code. */
  async loginCodeComplete(
    visibility: Public,
    input: {
      flowId: string;
      identifier: Identifier;
      code: string;
    },
  ): Promise<LoginResult> {
    void visibility;
    this.assertLoginFactor(input.identifier.type, "otp");
    let login;
    try {
      login = await this.deps.port.submitCodeLogin(
        input.flowId,
        input.identifier.value,
        input.code,
      );
    } catch {
      throw this.deps.errors.unauthorized("invalid credentials");
    }
    return this.finishLogin(login);
  }

  // ── Recovery ───────────────────────────────────────────────────────────────

  /** Step 1 — config-checked, masked exactly like `loginCodeStart`. */
  async recoveryStart(
    visibility: Public,
    input: {
      identifier: Identifier;
    },
  ): Promise<{ flowId: string }> {
    void visibility;
    const specs = resolveFactors(this.deps.authConfig, {
      intent: "recovery",
      identifier: input.identifier.type,
    });
    if (!specs.some((f) => f.method === "otp")) {
      throw this.deps.errors.badRequest(
        `recovery with "${input.identifier.type}" is not available`,
      );
    }
    try {
      return await this.deps.port.startRecovery(
        input.identifier.value,
        viaOf(input.identifier.type),
      );
    } catch (error) {
      this.deps.logger.info("recovery start failed (masked)", {
        kind: error instanceof IdentityProviderError ? error.kind : "unknown",
      });
      return { flowId: randomUUID() }; // decoy
    }
  }

  /** Step 2 — prove the code. Signs the caller in; the privileged session becomes the cookie. */
  async recoveryComplete(
    visibility: Public,
    input: {
      flowId: string;
      identifier: Identifier;
      code: string;
    },
  ): Promise<LoginResult> {
    void visibility;
    let recovered;
    try {
      recovered = await this.deps.port.submitRecovery(
        input.flowId,
        input.code,
        {
          value: input.identifier.value,
          via: viaOf(input.identifier.type),
        },
      );
    } catch {
      throw this.deps.errors.unauthorized("invalid code");
    }
    const snapshot = await this.deps.port.whoami({
      sessionToken: recovered.sessionToken,
    });
    return this.finishLogin({
      sessionToken: recovered.sessionToken,
      session: snapshot,
    });
  }

  /**
   * Step 3 — set the new password (never reveals whether one existed), then
   * revoke EVERY session, this one included.
   */
  async recoveryFinish(
    visibility: Public,
    input: {
      sessionToken: string;
      newPassword: string;
      identifierType?: IdentifierName;
    },
  ): Promise<void> {
    void visibility;
    this.assertPasswordPolicy(
      input.identifierType ?? "email",
      input.newPassword,
    );
    try {
      await this.deps.port.setPassword(input.sessionToken, input.newPassword);
    } catch (error) {
      throw this.mapProviderError(error);
    }

    const snapshot = await this.deps.port.whoami({
      sessionToken: input.sessionToken,
    });
    await this.deps.port.revokeSessions(snapshot.identityId);
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  /**
   * After any credential proof: self-heal the app user row (e.g. a seeded
   * admin) and sign the caller in. TOTP demands are the gate's job.
   */
  private async finishLogin(login: {
    sessionToken: string;
    session: SessionSnapshot;
  }): Promise<LoginResult> {
    const identityId = login.session.identityId;
    const user =
      await this.deps.userService.findOrCreateByIdentityId(identityId);
    return { sessionToken: login.sessionToken, userId: user.id };
  }

  /**
   * App user row + the profile/consent just given. A failure here leaves the
   * account standing; the gate collects what's missing.
   */
  private async seatUser(
    identityId: string,
    input: { name?: string; consents?: ConsentDecision[] },
    meta: RequestMeta,
  ): Promise<string> {
    const user =
      await this.deps.userService.findOrCreateByIdentityId(identityId);

    try {
      if (input.name) {
        await this.deps.userService.updateProfile(user.id, {
          name: input.name,
        });
      }
      if (input.consents?.length) {
        const items = consentItemsOf(
          dedupeObligations(
            resolveObligations(this.deps.authConfig, {
              intent: "registration",
            }),
          ),
        );
        if (items.length > 0) {
          await this.deps.consentRecordService.recordConsent({
            userId: user.id,
            items,
            decisions: input.consents,
            orgTypeId: null,
            context: "registration",
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
          });
        }
      }
    } catch (error) {
      // The account stands; the gate will ask again at /resolve.
      this.deps.logger.error("registration side-writes failed", {
        userId: user.id,
        message: error instanceof Error ? error.message : "unknown",
      });
    }

    await this.deps.hooks.onUserRegistered?.({ userId: user.id });
    return user.id;
  }

  /** Whether registration collects a password to SET at birth — the code is always the credential. */
  private registrationCollectsPassword(type: IdentifierName): boolean {
    return resolveFactors(this.deps.authConfig, {
      intent: "registration",
      identifier: type,
    }).some((f) => f.method === "password");
  }

  private assertRegistrationIdentifier(type: IdentifierName): void {
    const ctx = { intent: "registration" as const, identifier: type };
    if (!resolveIdentifiers(this.deps.authConfig, ctx).includes(type)) {
      throw this.deps.errors.badRequest(
        `"${type}" is not available for registration`,
      );
    }
  }

  /** Invitation-only products: no open signup without a live invitation. */
  private async assertSignupAllowed(invitationId?: string): Promise<void> {
    if (this.deps.authConfig.allowSpontaneousAccountCreation) return;
    if (!invitationId) {
      throw this.deps.errors.forbidden("registration is by invitation only");
    }
  }

  /** Refuse up front rather than birth an account the gate immediately blocks. */
  private assertRequiredProfile(type: IdentifierName, name?: string): void {
    const fields = requiredDataFields(
      dedupeObligations(
        resolveObligations(this.deps.authConfig, {
          intent: "registration",
          identifier: type,
        }),
      ),
    );
    if (fields.includes("name") && !name?.trim()) {
      throw this.deps.errors.badRequest("name is required");
    }
  }

  private assertPasswordPolicy(type: IdentifierName, password: string): void {
    const spec = resolveFactors(this.deps.authConfig, {
      intent: "registration",
      identifier: type,
    }).find((f) => f.method === "password");
    if (!spec) return;
    const problems = passwordPolicyProblems(spec.config, password);
    if (problems.length > 0) {
      throw this.deps.errors.badRequest(
        `password must contain ${problems.join(", ")}`,
      );
    }
  }

  /** Identifier visible + factor offered for authentication, per config. */
  private assertLoginFactor(
    type: IdentifierName,
    method: "password" | "otp",
  ): void {
    const ctx = { intent: "authentication" as const, identifier: type };
    if (!resolveIdentifiers(this.deps.authConfig, ctx).includes(type)) {
      throw this.deps.errors.badRequest(
        `identifier "${type}" is not available for login`,
      );
    }
    if (
      !resolveFactors(this.deps.authConfig, ctx).some(
        (f) => f.method === method,
      )
    ) {
      throw this.deps.errors.badRequest(
        `"${method}" login is not available for "${type}"`,
      );
    }
  }

  private traitsFor(identifier: Identifier, name?: string): IdentityTraits {
    return {
      ...(identifier.type === "phone"
        ? { phone: identifier.value }
        : { email: identifier.value }),
      ...(name ? { name } : {}),
    };
  }

  private mapVerifyError(error: unknown): Error {
    if (
      error instanceof IdentityProviderError &&
      error.kind === "invalid_credentials"
    ) {
      return this.deps.errors.badRequest("invalid or expired code");
    }
    return this.mapProviderError(error);
  }

  private mapProviderError(error: unknown): Error {
    if (error instanceof IdentityProviderError) {
      switch (error.kind) {
        case "duplicate_identifier":
          return this.deps.errors.badRequest("identifier already in use");
        case "policy_violation":
          return this.deps.errors.badRequest(error.message);
        case "invalid_credentials":
          return this.deps.errors.unauthorized("invalid credentials");
        case "flow_expired":
          return this.deps.errors.badRequest("expired — please start again");
        default:
          this.deps.logger.error("identity provider error", {
            kind: error.kind,
            message: error.message,
          });
          return this.deps.errors.internalError("identity provider error");
      }
    }
    return error instanceof Error
      ? error
      : this.deps.errors.internalError("unknown error");
  }
}
