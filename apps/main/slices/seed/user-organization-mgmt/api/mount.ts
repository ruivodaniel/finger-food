/**
 * mountUserOrgApi — the module's single assembly point.
 *
 * Takes the identity provider, builds the repositories, services, middlewares, and
 * routers from the app's inputs (db, config, transports, error constructors)
 * and returns the full surface. The app mounts what it receives; nothing in
 * here reaches for app internals.
 */

import { Hono } from "hono";

import { DrizzleUserRepository } from "./repositories/user.repository";
import { DrizzleUserProfileRepository } from "./repositories/user-profile.repository";
import { DrizzleUserPreferencesRepository } from "./repositories/user-preferences.repository";
import { DrizzleUserContactRepository } from "./repositories/user-contact.repository";
import { DrizzleLegalDocumentRepository } from "./repositories/legal-document.repository";
import { DrizzleConsentRecordRepository } from "./repositories/consent-record.repository";
import { DrizzleOrganizationRepository } from "./repositories/organization.repository";
import { DrizzleMembershipRepository } from "./repositories/membership.repository";
import { AuthService } from "./services/auth.service";
import { GateService } from "./services/gate.service";
import { LegalDocumentService } from "./services/legal-document.service";
import { ConsentRecordService } from "./services/consent-record.service";
import { OrganizationService } from "./services/organization.service";
import { MembershipService } from "./services/membership.service";
import { InvitationService } from "./services/invitation.service";
import { DrizzleInvitationRepository } from "./repositories/invitation.repository";
import { SessionService } from "./services/session.service";
import { UserService } from "./services/user.service";
import { UserProfileService } from "./services/user-profile.service";
import { UserPreferencesService } from "./services/user-preferences.service";
import { UserContactService } from "./services/user-contact.service";
import { createSessionMiddleware } from "./middlewares/create-session-middleware";
import { createScopedAcMiddleware } from "./middlewares/create-scoped-ac-middleware";
import { createGateMiddleware } from "./middlewares/create-gate-middleware";
import { createAuthRouter } from "./routes/create-auth-router";
import { createMeRouter } from "./routes/create-me-router";
import { createSecurityRouter } from "./routes/create-security-router";
import { SecurityService } from "./services/security.service";
import { createLegalRouter } from "./routes/create-legal-router";
import { createGateRouter } from "./routes/create-gate-router";
import { createOrgRouter } from "./routes/create-org-router";
import { createMyOrgsRouter } from "./routes/create-my-orgs-router";
import {
  DEFAULT_SESSION_COOKIE,
  type SessionCookieConfig,
} from "./shared/cookies";
import { guardHooks } from "./shared/guard-hooks";
import type {
  MountUserOrgApiOptions,
  MountUserOrgApiResult,
} from "./mount-types";
import type { UserOrgMgmtEnv } from "./types";

export function mountUserOrgApi(
  options: MountUserOrgApiOptions,
): MountUserOrgApiResult {
  const hooks = guardHooks(options.hooks ?? {}, options.logger);
  const socialProviders = options.socialProviders ?? {
    google: false,
    apple: false,
  };
  const cookie: SessionCookieConfig = {
    ...DEFAULT_SESSION_COOKIE,
    ...(options.cookie?.name ? { name: options.cookie.name } : {}),
    ...(options.cookie?.domain ? { domain: options.cookie.domain } : {}),
    ...(options.cookie?.secure !== undefined
      ? { secure: options.cookie.secure }
      : {}),
  };

  const identityProvider = options.identityProvider;

  const userRepo = new DrizzleUserRepository({
    db: options.db,
    createId: options.createId,
  });
  const userProfileRepo = new DrizzleUserProfileRepository({ db: options.db });
  const userContactRepo = new DrizzleUserContactRepository({
    db: options.db,
    createId: options.createId,
  });
  const legalDocumentRepo = new DrizzleLegalDocumentRepository({
    db: options.db,
    createId: options.createId,
  });
  const consentRecordRepo = new DrizzleConsentRecordRepository({
    db: options.db,
    createId: options.createId,
  });
  const organizationRepo = new DrizzleOrganizationRepository({
    db: options.db,
    createId: options.createId,
  });
  const membershipRepo = new DrizzleMembershipRepository({
    db: options.db,
    createId: options.createId,
  });
  const invitationRepo = new DrizzleInvitationRepository({
    db: options.db,
    createId: options.createId,
  });

  const legalDocumentService = new LegalDocumentService({
    legalDocumentRepo,
    engine: options.engine,
    authConfig: options.authConfig,
    orgConfig: options.orgConfig,
    errors: options.errors,
    logger: options.logger,
  });
  const consentRecordService = new ConsentRecordService({
    consentRecordRepo,
    legalDocumentService,
    engine: options.engine,
    errors: options.errors,
  });
  const userProfileService = new UserProfileService({
    userProfileRepo,
    engine: options.engine,
    errors: options.errors,
  });
  const userContactService = new UserContactService({
    userContactRepo,
    engine: options.engine,
  });
  const userPreferencesService = new UserPreferencesService({
    userPreferencesRepo: new DrizzleUserPreferencesRepository(),
    engine: options.engine,
    policy: options.preferences,
    errors: options.errors,
  });
  const userService = new UserService({
    userRepo,
    userProfileService,
    userContactService,
    port: identityProvider,
    storage: options.storage,
    hooks,
    errors: options.errors,
    logger: options.logger,
  });
  // Membership and organization reference each other (org type for last-owner
  // protection, owner seating on create) — the thunk closes the cycle.
  const membershipService: MembershipService = new MembershipService({
    membershipRepo,
    organizationService: () => organizationService,
    engine: options.engine,
    orgConfig: options.orgConfig,
    authConfig: options.authConfig,
    errors: options.errors,
  });
  const organizationService: OrganizationService = new OrganizationService({
    orgRepo: organizationRepo,
    membershipService,
    consentRecordService,
    engine: options.engine,
    storage: options.storage,
    orgConfig: options.orgConfig,
    authConfig: options.authConfig,
    errors: options.errors,
    logger: options.logger,
  });
  const sessionService = new SessionService({
    port: identityProvider,
    userService,
    membershipService,
  });
  const gateService = new GateService({
    authConfig: options.authConfig,
    orgConfig: options.orgConfig,
    port: identityProvider,
    userService,
    legalDocumentService,
    consentRecordService,
    logger: options.logger,
  });
  const securityService = new SecurityService({
    port: identityProvider,
    userService,
    errors: options.errors,
  });
  const invitationService = new InvitationService({
    invitationRepo,
    membershipService,
    organizationService,
    userService,
    engine: options.engine,
    port: identityProvider,
    legalDocumentService,
    consentRecordService,
    orgConfig: options.orgConfig,
    authConfig: options.authConfig,
    delivery: options.invitationDelivery,
    hooks,
    errors: options.errors,
    logger: options.logger,
  });
  const authService = new AuthService({
    authConfig: options.authConfig,
    port: identityProvider,
    userService,
    consentRecordService,
    hooks,
    errors: options.errors,
    logger: options.logger,
    socialProviders,
  });

  const sessionMiddleware = createSessionMiddleware({
    sessionService,
    cookie,
  });
  // Scoped-AC hydration (UOM13): the app injects the engine + gated-db factory +
  // baseline roles; this middleware fills the reserved slot between session and
  // gate. No repo/service consumes the engine yet (this commit only wires boot).
  const scopedAcMiddleware = createScopedAcMiddleware({
    engine: options.engine,
    gatedDb: options.gatedDb,
    baselineRoles: options.baselineRoles,
  });
  const gateMiddleware = createGateMiddleware({
    gateService,
    excludePaths: ["/gate/check", "/legal/", "/me", "/invitations/"],
  });

  const authRouter = createAuthRouter({
    authService,
    sessionService,
    userService,
    cookie,
    errors: options.errors,
  });
  // the auth surface resolves sessions itself (GET /session, POST /logout)
  const authMountRouter = new Hono<UserOrgMgmtEnv>();
  authMountRouter.use("*", sessionMiddleware).route("/", authRouter);

  const router = new Hono<UserOrgMgmtEnv>()
    .route(
      "/",
      createMeRouter({ userService, userPreferencesService, errors: options.errors }),
    )
    .route(
      "/",
      createSecurityRouter({ securityService, errors: options.errors }),
    )
    .route(
      "/",
      createLegalRouter({
        legalDocumentService,
        consentRecordService,
        gateService,
        errors: options.errors,
      }),
    )
    .route(
      "/",
      createOrgRouter({
        organizationService,
        membershipService,
        invitationService,
        errors: options.errors,
      }),
    )
    .route(
      "/",
      createMyOrgsRouter({
        organizationService,
        membershipService,
        invitationService,
        errors: options.errors,
      }),
    )
    .route(
      "/",
      createGateRouter({
        gateService,
        errors: options.errors,
      }),
    );

  return {
    authMount: {
      basePath: "/api/auth",
      router: authMountRouter,
      rateLimitPaths: {
        signIn: "/api/auth/login",
        signUp: "/api/auth/register",
      },
    },
    router,
    sessionMiddleware,
    scopedAcMiddleware,
    gateMiddleware,
    services: {
      auth: authService,
      session: sessionService,
      gate: gateService,
      user: userService,
      legalDocument: legalDocumentService,
      consentRecord: consentRecordService,
      organization: organizationService,
      membership: membershipService,
      invitation: invitationService,
    },
    identityProvider,
  };
}
