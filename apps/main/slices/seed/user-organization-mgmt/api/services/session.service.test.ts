// =============================================================================
// Session service tests — resolving the provider session token (the cookie's
// value) to a session view, and the active-org targeting rules: the request's
// claim is honored only when it names one of the caller's memberships; there
// is no fallback. Docker-free.
// =============================================================================

import { describe, it, expect } from "vitest";
import { SessionService } from "./session.service";
import { UserService } from "./user.service";
import { FakeIdentityPort } from "../testing/fake-identity-port";
import {
  InMemoryUserRepository,
  makeUserStack,
  testErrors,
} from "../testing/in-memory-repos";

type Membership = { organizationId: string; orgType: string; roles: string[] };

async function build(memberships: Membership[]) {
  const port = new FakeIdentityPort();
  const userRepo = new InMemoryUserRepository();

  const reg = await port.registerPassword({ email: "u@test.dev" }, "Str0ng-1!");
  const user = await userRepo.create({ identityId: reg.identityId });

  const service = new SessionService({
    port,
    userService: new UserService({
      userRepo,
    ...makeUserStack({ userRepo }),
      port,
      hooks: {},
      errors: testErrors,
    }),
    membershipService: { getMembershipFactsByUserId: async () => memberships },
  });
  // the cookie IS the provider session token — there is no row in between
  return { service, userId: user.id, token: reg.sessionToken };
}

const A: Membership = { organizationId: "orgA", orgType: "company", roles: ["company_owner"] };
const B: Membership = { organizationId: "orgB", orgType: "platform_admin", roles: ["platform_owner"] };

describe("session active-org targeting", () => {
  it("honors a requested org the caller belongs to", async () => {
    const t = await build([A, B]);
    const resolved = await t.service.resolve(t.token, "orgB");
    expect(resolved?.view.activeOrganizationId).toBe("orgB");
  });

  it("is null when the request targets nothing — no fallback", async () => {
    const t = await build([A, B]);
    const resolved = await t.service.resolve(t.token);
    expect(resolved?.view.activeOrganizationId).toBeNull();
  });

  it("is null when the request targets an org the caller left", async () => {
    const t = await build([A]);
    const resolved = await t.service.resolve(t.token, "orgGONE");
    expect(resolved?.view.activeOrganizationId).toBeNull();
  });

  it("is null for a caller with no memberships, whatever the request says", async () => {
    const t = await build([]);
    const resolved = await t.service.resolve(t.token, "orgA");
    expect(resolved?.view.activeOrganizationId).toBeNull();
  });

  it("exposes membership facts (org id + type + roles) on the view", async () => {
    const t = await build([A, B]);
    const resolved = await t.service.resolve(t.token);
    expect(resolved?.view.memberships).toEqual([A, B]);
  });
});
