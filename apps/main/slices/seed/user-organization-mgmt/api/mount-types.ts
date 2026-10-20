/**
 * Mount types — the options an app supplies and the surface it receives.
 */

import type { Hono, MiddlewareHandler } from "hono";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Ac, GatedDb, SchemaTables } from "@libs/gated-scoped-ac";

import type {
  AuthAndRegistrationConfig,
  OrgLifecycleEntry,
} from "../shared/auth-config/types";
import type { UserOrgMgmtHooks } from "../shared/types/hooks";
import type { PreferencesPolicy } from "../shared/types/preferences";
import type { IdentityProviderPort } from "./identity/identity-provider.port";
import type { ScopedAcEnv } from "./types";
import type { AuthService } from "./services/auth.service";
import type { GateService } from "./services/gate.service";
import type { LegalDocumentService } from "./services/legal-document.service";
import type { ConsentRecordService } from "./services/consent-record.service";
import type { OrganizationService } from "./services/organization.service";
import type { MembershipService } from "./services/membership.service";
import type { InvitationService } from "./services/invitation.service";
import type { SessionService } from "./services/session.service";
import type { UserService } from "./services/user.service";
import type { ModuleErrors, ModuleLogger } from "./shared/module-errors";
import type { StoragePort } from "./shared/storage-port";
import type { UserOrgMgmtEnv } from "./types";

export interface MountUserOrgApiOptions {
  /** Drizzle database instance (the app's — module tables flow in via ./models). */
  db: NodePgDatabase<Record<string, unknown>>;

  /** Id factory for domain rows (cuid2 in the seed). */
  createId: () => string;

  /**
   * The scoped-AC engine (createAc) — a config-bound singleton. Injected so the
   * module never imports the config or constructs the engine (AC37). Used now by
   * the hydration middleware; repos/services consume it when the swap lands.
   */
  engine: Ac;

  /**
   * The gated-db factory (createGatedDb): bag -> the per-request DB handle. The
   * app owns the raw db handle + entity->table map; the module receives the
   * sealed factory and never sees either (AC37).
   */
  gatedDb: (bag: unknown) => GatedDb<SchemaTables>;

  /**
   * Roles every authenticated user always holds (the account baseline). The app
   * derives them from config; the hydration middleware unions them into each
   * request's role set so the baseline's permissions apply.
   */
  baselineRoles: string[];

  /** The product's auth config instance (validated on import). */
  authConfig: AuthAndRegistrationConfig;

  /** The product's org-lifecycle config (create/join policy per org type). */
  orgConfig: OrgLifecycleEntry[];

  /**
   * The product's preferences policy (defaults, what users may override,
   * "follow the system", supported values) — the slice never imports it.
   */
  preferences: PreferencesPolicy;

  /** The identity provider (the app builds it: the local provider, or any adapter of the port). */
  identityProvider: IdentityProviderPort;

  /**
   * Object storage for avatar/org-logo uploads (the app injects its provider,
   * e.g. @libs/storage). The module derives keys and authorizes; the caller
   * never chooses storage paths.
   */
  storage: StoragePort;

  /** Session cookie shape. Name defaults to "uom_session". */
  cookie?: {
    name?: string;
    domain?: string;
    secure?: boolean;
  };

  /** Which social providers are actually enabled (env-derived). */
  socialProviders?: { google: boolean; apple: boolean };

  /**
   * Invitation delivery — the app owns the transport (email/SMS) and composes
   * its own accept URL from the payload. Absent = invitations are created but
   * not delivered (a warning is logged; useful in tests).
   */
  invitationDelivery?: InvitationDelivery;

  hooks?: UserOrgMgmtHooks;
  errors: ModuleErrors;
  logger: ModuleLogger;
}

/** What the app's transport receives to render an invitation message. */
export interface InvitationDeliveryPayload {
  invitationId: string;
  organizationName: string;
  orgTypeLabel: string;
  roles: string[];
  inviterName: string | null;
  expiresAt: string;
}

export interface InvitationDelivery {
  sendEmail: (
    to: string,
    payload: InvitationDeliveryPayload,
  ) => void | Promise<void>;
  sendSms: (
    to: string,
    payload: InvitationDeliveryPayload,
  ) => void | Promise<void>;
}

export interface AuthMountDescriptor {
  basePath: string;
  router: Hono<UserOrgMgmtEnv>;
  rateLimitPaths: { signIn: string; signUp: string };
}

export interface MountUserOrgApiResult {
  /** Credential-flow surface — mount at basePath (default /api/auth). */
  authMount: AuthMountDescriptor;

  /** Domain surface (me/legal/gate) — mount inside the app's client router. */
  router: Hono<UserOrgMgmtEnv>;

  /** Cookie → session context vars. Mount before router + gate. */
  sessionMiddleware: MiddlewareHandler<UserOrgMgmtEnv>;

  /**
   * Scoped-AC hydration (UOM13) — builds the per-request bag + permissions +
   * gated-db handle. Mount between sessionMiddleware and gateMiddleware (API21).
   */
  scopedAcMiddleware: MiddlewareHandler<ScopedAcEnv>;

  /** 428 enforcement on domain requests. Mount after sessionMiddleware. */
  gateMiddleware: MiddlewareHandler<UserOrgMgmtEnv>;

  /** Server-side service handles for non-HTTP callers (seeds, hooks). */
  services: {
    auth: AuthService;
    session: SessionService;
    gate: GateService;
    user: UserService;
    legalDocument: LegalDocumentService;
    consentRecord: ConsentRecordService;
    organization: OrganizationService;
    membership: MembershipService;
    invitation: InvitationService;
  };

  /** The identity port — seeds provision admin identities through this. */
  identityProvider: IdentityProviderPort;
}
