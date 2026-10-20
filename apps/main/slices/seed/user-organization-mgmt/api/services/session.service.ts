/**
 * Session service — turns the session cookie into a live session.
 *
 * No session table: the cookie's value IS the provider session token, and the
 * provider is the single source of truth for liveness, expiry, and proofs.
 *
 * The module owns the caller's ORG-CONTEXT, resolved fresh per request:
 * memberships (the gate's input) and the active org — the request's
 * org-targeting header validated against those memberships.
 *
 * Facts only, never a verdict.
 */

import type { Public } from "@libs/gated-scoped-ac";
import type { SessionView } from "../../shared/types/domain";
import {
  IdentityProviderError,
  type IdentityProviderPort,
  type SessionSnapshot,
} from "../identity/identity-provider.port";
import type { UomUserSelect } from "../models/user.model";
import type { MembershipService } from "./membership.service";
import type { UserService } from "./user.service";

export interface ResolvedSession {
  user: UomUserSelect;
  view: SessionView;
  snapshot: SessionSnapshot;
}

export interface SessionServiceDeps {
  port: IdentityProviderPort;
  userService: Pick<UserService, "findByIdentityId">;
  membershipService: Pick<MembershipService, "getMembershipFactsByUserId">;
}

export class SessionService {
  constructor(private readonly deps: SessionServiceDeps) {}

  /** Null when the token doesn't name a live session, or has no app user row.
   * AC42: token-less — session resolution is middleware-only infrastructure
   * (rule 5), reached from no route directly. */
  async resolve(
    sessionToken: string,
    requestedOrgId?: string | null,
  ): Promise<ResolvedSession | null> {
    let snapshot: SessionSnapshot;
    try {
      snapshot = await this.deps.port.whoami({ sessionToken });
    } catch (error) {
      if (
        error instanceof IdentityProviderError &&
        error.kind === "session_invalid"
      ) {
        return null;
      }
      throw error;
    }
    if (!snapshot.active) return null;

    const user = await this.deps.userService.findByIdentityId(
      snapshot.identityId,
    );
    if (!user) return null;

    // Org-context resolved once here; the gate reads roles off the session.
    const memberships =
      await this.deps.membershipService.getMembershipFactsByUserId(user.id);

    // No fallback: a request targeting nothing (or a foreign org) gets null,
    // never a silently-picked org.
    const activeOrganizationId =
      requestedOrgId &&
      memberships.some((m) => m.organizationId === requestedOrgId)
        ? requestedOrgId
        : null;

    return {
      user,
      snapshot,
      view: {
        id: snapshot.id,
        userId: user.id,
        activeOrganizationId,
        memberships: memberships.map(({ organizationId, orgType, roles }) => ({
          organizationId,
          orgType,
          roles,
        })),
        aal: snapshot.aal,
        methods: snapshot.methods.map((m) => m.method),
        expiresAt: snapshot.expiresAt,
      },
    };
  }

  /** End this session at the provider. The caller clears the cookie. AC42:
   * Public — `POST /logout` is the pre-session credential surface. */
  async logout(visibility: Public, sessionToken: string): Promise<void> {
    void visibility; // no repo/service call to thread into — port only
    await this.deps.port.logout(sessionToken).catch(() => {
      // already gone provider-side — the cookie still gets cleared
    });
  }
}
