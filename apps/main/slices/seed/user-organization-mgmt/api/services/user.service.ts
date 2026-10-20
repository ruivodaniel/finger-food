/**
 * User service — the caller-facing aggregate over the app user row, profile,
 * and provider identifiers.
 */

import { PRIVATE, type Private, type Public } from "@libs/gated-scoped-ac";
import type { UserView } from "../../shared/types/domain";
import {
  IdentityProviderError,
  identifierTypeOf,
  viaOf,
  type IdentityProviderPort,
  type IdentitySnapshot,
} from "../identity/identity-provider.port";
import type { ScopedAcRequestContext } from "../shared/scoped-ac";
import type { UserRepository } from "../repositories/user.repository";
import type { ProfilePatch } from "../repositories/user-profile.repository";
import type {
  UomUserProfileSelect,
  UomUserSelect,
} from "../models/user.model";
import type { UserProfileService } from "./user-profile.service";
import type { UserContactService } from "./user-contact.service";
import type { UserOrgMgmtHooks } from "../../shared/types/hooks";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import { imageExtensionOf, type StoragePort } from "../shared/storage-port";

export interface UserServiceDeps {
  userRepo: UserRepository;
  /** Profile + contacts are their own entities — reached through their
   * services, never their repositories (API12). */
  userProfileService: Pick<
    UserProfileService,
    "create" | "getByUserId" | "update" | "updateScoped"
  >;
  userContactService: Pick<UserContactService, "seedDefault">;
  port: IdentityProviderPort;
  storage: StoragePort;
  hooks: UserOrgMgmtHooks;
  errors: ModuleErrors;
  logger?: ModuleLogger;
}

export class UserService {
  constructor(private readonly deps: UserServiceDeps) {}

  // ── Narrow accessors — the only door to the user rows for other services ──

  /** The app user row for a provider identity, or null. */
  async findByIdentityId(identityId: string): Promise<UomUserSelect | null> {
    return this.deps.userRepo.findByIdentityId(identityId);
  }

  /**
   * The app user row, created when missing — the self-heal every credential
   * proof runs. A created row gets its default contact seeded from the first
   * address; a failed seed never fails the birth.
   */
  async findOrCreateByIdentityId(identityId: string): Promise<UomUserSelect> {
    const existing = await this.deps.userRepo.findByIdentityId(identityId);
    if (existing) return existing;
    const user = await this.deps.userRepo.create({ identityId });
    await this.deps.userProfileService.create(user.id);
    try {
      const identity = await this.deps.port.getIdentity(identityId);
      const first = identity.addresses[0];
      if (first) {
        await this.seedDefaultContact(user.id, {
          type: identifierTypeOf(first.via),
          value: first.value,
        });
      }
    } catch (error) {
      this.deps.logger?.warn("default-contact seed failed — account stands", {
        userId: user.id,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
    return user;
  }

  /** The provider identity behind a user id — 404 for an unknown user. AC42:
   * private — the only non-exempt caller is the private `/me/security`
   * surface (`securityService.status`); the exempt `ownedIdentifiers` helper
   * passes `PRIVATE` directly. */
  async identityIdOf(visibility: Private, userId: string): Promise<string> {
    const user =
      (await this.deps.userRepo.findByIds(visibility, [userId]))[0] ?? null;
    if (!user) throw this.deps.errors.notFound("user not found");
    return user.identityId;
  }

  /** The profile row, or null for an unknown user — a read, never a throw.
   * AC42: private — every genuine caller (the gate evaluator's exempt `isMet`,
   * `invitationService.deliver`) is private-only. */
  async getProfile(
    visibility: Private,
    userId: string,
  ): Promise<UomUserProfileSelect | null> {
    return this.deps.userProfileService.getByUserId(visibility, userId);
  }

  /** Seed the default contact once — an existing default wins; contacts never sync afterwards. */
  private async seedDefaultContact(
    userId: string,
    identifier: { type: "email" | "phone"; value: string },
  ): Promise<void> {
    await this.deps.userContactService.seedDefault(userId, {
      label: "Primary",
      type: identifier.type,
      value: identifier.value,
    });
  }

  /** AC42: Public — reached by both the pre-session credential surface
   * (register/login/recovery flows, `GET /session`) and the private `/me`
   * surface; Public is the loosest demand covering both. */
  async getMe(visibility: Public, userId: string): Promise<UserView> {
    const user =
      (await this.deps.userRepo.findByIds(visibility, [userId]))[0] ?? null;
    if (!user) throw this.deps.errors.notFound("user not found");
    const profile = await this.deps.userProfileService.getByUserId(
      visibility,
      userId,
    );
    const identity = await this.deps.port.getIdentity(user.identityId);
    return {
      id: user.id,
      profile: {
        name: profile?.name ?? identity.traits.name ?? null,
        image: profile?.image ?? null,
        data: profile?.data ?? {},
      },
      identifiers: identity.addresses.map((a) => ({
        type: identifierTypeOf(a.via),
        value: a.value,
        verified: a.verified,
      })),
    };
  }

  /** Raw profile write — the pre-session registration name-seed (auth.service,
   * no bag yet). The authenticated `/me` write is `updateOwnProfile`. */
  async updateProfile(userId: string, patch: ProfilePatch): Promise<void> {
    await this.deps.userProfileService.update(userId, patch);
    await this.deps.hooks.onUserUpdated?.({ userId });
  }

  /** The authenticated caller updating their OWN profile (`PATCH /me/profile`):
   * the profile owner gates the write behind the engine (AC5/AC10). Split from
   * the raw `updateProfile` by signature (a travelling AC context) — the
   * pre-session seed never carries one. */
  async updateOwnProfile(
    ac: ScopedAcRequestContext,
    visibility: Private,
    userId: string,
    patch: ProfilePatch,
  ): Promise<void> {
    await this.deps.userProfileService.updateScoped(
      ac,
      visibility,
      userId,
      patch,
    );
    await this.deps.hooks.onUserUpdated?.({ userId });
  }

  /**
   * Presign the caller's avatar upload. The server derives the key — the
   * client never chooses storage paths. The returned publicUrl is what
   * `updateProfile({ image })` stores after the browser PUTs the bytes.
   */
  async presignAvatarUpload(
    visibility: Private,
    userId: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    void visibility; // no repo/service call to thread into — storage only
    const extension = imageExtensionOf(contentType);
    if (!extension) {
      throw this.deps.errors.badRequest("unsupported image type");
    }
    return this.deps.storage.presignPut(
      `public/users/${userId}/avatar/${Date.now()}.${extension}`,
      contentType,
    );
  }

  /**
   * Attach another login identifier (capped: 3 emails / 2 phones) and start
   * its verification — proven with `verifyIdentifier`.
   */
  async addIdentifier(
    visibility: Private,
    userId: string,
    identifier: { type: "email" | "phone"; value: string },
  ): Promise<{ verificationFlowId: string }> {
    const found =
      (await this.deps.userRepo.findByIds(visibility, [userId]))[0] ?? null;
    if (!found) throw this.deps.errors.notFound("user not found");
    const holder = await this.deps.port.findByIdentifier(identifier.value);
    if (holder && holder.id !== found.identityId) {
      throw this.deps.errors.badRequest("that address is already in use");
    }
    if (holder) {
      // Caller's own identifier: verified → nothing to add; unverified →
      // (re)start verification, so re-posting doubles as "resend the code".
      const address = holder.addresses.find(
        (a) => a.value === identifier.value,
      );
      if (address?.verified) {
        throw this.deps.errors.badRequest(
          "that address is already added and verified",
        );
      }
    } else {
      try {
        await this.deps.port.addIdentifier(found.identityId, identifier);
      } catch (e) {
        throw this.asCallerError(e);
      }
    }
    let started;
    try {
      started = await this.deps.port.startVerification(
        identifier.value,
        viaOf(identifier.type),
      );
    } catch (e) {
      // Identifier already attached — the same POST retries the delivery.
      throw this.asCallerError(e);
    }
    await this.deps.hooks.onUserUpdated?.({ userId });
    return { verificationFlowId: started.flowId };
  }

  /**
   * Prove the code delivered to a newly added identifier — the address must
   * be on the CALLER's identity (the sms path runs a code login as it).
   */
  async verifyIdentifier(
    visibility: Private,
    userId: string,
    input: {
      flowId: string;
      code: string;
      type: "email" | "phone";
      value: string;
    },
  ): Promise<void> {
    await this.assertOwnIdentifier(visibility, userId, input);
    await this.deps.port.submitVerification(input.flowId, input.code, {
      value: input.value,
      via: viaOf(input.type),
    });
  }

  /**
   * Detach a login identifier. Hard rule: an account keeps at least one
   * (zero is unrecoverable). Whether the remaining ones stay usable per
   * membership context is the gate's invariant — it walks the caller
   * back through /resolve.
   */
  async removeIdentifier(
    visibility: Private,
    userId: string,
    identifier: { type: "email" | "phone"; value: string },
  ): Promise<void> {
    const identity = await this.assertOwnIdentifier(
      visibility,
      userId,
      identifier,
    );
    if (identity.addresses.length <= 1) {
      throw this.deps.errors.badRequest(
        "an account keeps at least one login identifier",
      );
    }
    await this.deps.port.removeIdentifier(identity.id, identifier);
    await this.deps.hooks.onUserUpdated?.({ userId });
  }

  /** The caller's identity, with the address proven to be on it. */
  private async assertOwnIdentifier(
    visibility: Private,
    userId: string,
    identifier: { type: "email" | "phone"; value: string },
  ): Promise<IdentitySnapshot> {
    const found =
      (await this.deps.userRepo.findByIds(visibility, [userId]))[0] ?? null;
    if (!found) throw this.deps.errors.notFound("user not found");
    const identity = await this.deps.port.getIdentity(found.identityId);
    const owned = identity.addresses.some(
      (a) =>
        a.value === identifier.value && identifierTypeOf(a.via) === identifier.type,
    );
    if (!owned) {
      throw this.deps.errors.badRequest("that address is not on this account");
    }
    return identity;
  }

  /** Provider rule violations (caps, duplicates) are the caller's mistake — 400, not 500. */
  private asCallerError(e: unknown): unknown {
    if (e instanceof IdentityProviderError) {
      if (e.kind === "policy_violation") {
        return this.deps.errors.badRequest(e.message);
      }
      if (e.kind === "duplicate_identifier") {
        return this.deps.errors.badRequest("that address is already in use");
      }
    }
    return e;
  }
}
