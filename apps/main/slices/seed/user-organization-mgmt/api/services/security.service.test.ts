// =============================================================================
// Security service tests — "sign out everywhere".
//
// With no session table, this is provider-native: there is no second store that
// could disagree about which sessions are live. Revoking siblings at the
// provider IS the revocation, and the caller's own session survives.
// Docker-free.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { PRIVATE } from "@libs/gated-scoped-ac";
import { SecurityService } from "./security.service";
import { SessionService } from "./session.service";
import { UserService } from "./user.service";
import { FakeIdentityPort } from "../testing/fake-identity-port";
import {
  InMemoryUserRepository,
  makeUserStack,
  testErrors,
} from "../testing/in-memory-repos";

function build() {
  const port = new FakeIdentityPort();
  const userRepo = new InMemoryUserRepository();
  const userService = new UserService({
    userRepo,
    ...makeUserStack({ userRepo }),
    port,
    hooks: {},
    errors: testErrors,
  });
  const sessionService = new SessionService({
    port,
    userService,
    membershipService: { getMembershipFactsByUserId: async () => [] },
  });
  const service = new SecurityService({
    port,
    userService,
    errors: testErrors,
  });
  return { port, userRepo, sessionService, service };
}

/** An identity + app user row, signed in `logins` times — one token each. */
async function signIn(
  t: ReturnType<typeof build>,
  email: string,
  logins: number,
) {
  const { identityId } = await t.port.createIdentity({
    traits: { email },
    password: "Str0ng-pass!",
    verifiedEmails: [email],
  });
  const user = await t.userRepo.create({ identityId });
  const tokens: string[] = [];
  for (let i = 0; i < logins; i++) {
    const { sessionToken } = await t.port.loginPassword(email, "Str0ng-pass!");
    tokens.push(sessionToken);
  }
  return { user, tokens };
}

describe("sign out everywhere", () => {
  let t: ReturnType<typeof build>;

  beforeEach(() => {
    t = build();
  });

  it("revokes every other session, keeping the caller's", async () => {
    const { tokens } = await signIn(t, "ana@test.dev", 3);
    const [keeper, other1, other2] = tokens;

    await t.service.signOutOtherSessions(PRIVATE, keeper);

    // the calling session still resolves; the siblings are dead
    expect(await t.sessionService.resolve(keeper)).not.toBeNull();
    expect(await t.sessionService.resolve(other1)).toBeNull();
    expect(await t.sessionService.resolve(other2)).toBeNull();

    // provider-side too — there is no second store to fall out of sync
    await expect(t.port.whoami({ sessionToken: other1 })).rejects.toThrow();
    await expect(t.port.whoami({ sessionToken: other2 })).rejects.toThrow();
  });

  it("does not touch another user's sessions", async () => {
    const { tokens } = await signIn(t, "ana@test.dev", 1);
    const bystander = await signIn(t, "bruno@test.dev", 1);

    await t.service.signOutOtherSessions(PRIVATE, tokens[0]);

    expect(await t.sessionService.resolve(bystander.tokens[0])).not.toBeNull();
  });

  it("a token that names no live session is refused", async () => {
    await expect(
      t.service.signOutOtherSessions(PRIVATE, "not-a-token"),
    ).rejects.toThrow();
  });
});
