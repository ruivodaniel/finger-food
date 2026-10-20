// =============================================================================
// User service tests — identifier management against the in-memory identity
// port. Provider rule violations must surface as caller errors (400s), never
// fall through to a 500. Docker-free.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { PRIVATE } from "@libs/gated-scoped-ac";
import { FAKE_CODE, FakeIdentityPort } from "../testing/fake-identity-port";
import { UserService } from "./user.service";
import {
  InMemoryUserRepository,
  makeUserStack,
  testErrors,
} from "../testing/in-memory-repos";

function build() {
  const port = new FakeIdentityPort();
  const userRepo = new InMemoryUserRepository();
  const userStack = makeUserStack({ userRepo });
  const service = new UserService({
    userRepo,
    ...userStack,
    port,
    hooks: {},
    errors: testErrors,
  });
  return { port, userRepo, userContactRepo: userStack.userContactRepo, service };
}

async function makeUser(t: ReturnType<typeof build>, email: string) {
  const { identityId } = await t.port.createIdentity({
    traits: { email },
    password: "Str0ng-pass!",
    verifiedEmails: [email],
  });
  return t.userRepo.create({ identityId });
}

describe("default contact seeding", () => {
  let t: ReturnType<typeof build>;

  beforeEach(() => {
    t = build();
  });

  it("a CREATED user row gets its default contact from the first address", async () => {
    const { identityId } = await t.port.createIdentity({
      traits: { email: "born@test.dev" },
      password: "Str0ng-pass!",
      verifiedEmails: ["born@test.dev"],
    });
    const user = await t.service.findOrCreateByIdentityId(identityId);
    const contact = (
      await t.userContactRepo.findAllByUserIds([user.id])
    ).find((c) => c.isDefault);
    expect(contact?.contact).toEqual({
      label: "Primary",
      type: "email",
      value: "born@test.dev",
    });
    expect(contact?.isDefault).toBe(true);
  });

  it("an EXISTING user row is never re-seeded", async () => {
    const { identityId } = await t.port.createIdentity({
      traits: { email: "again@test.dev" },
      password: "Str0ng-pass!",
      verifiedEmails: ["again@test.dev"],
    });
    await t.service.findOrCreateByIdentityId(identityId);
    await t.service.findOrCreateByIdentityId(identityId); // self-heal re-entry
    expect(t.userContactRepo.contacts.filter((c: { isDefault: boolean }) => c.isDefault)).toHaveLength(1);
  });
});

describe("profile updates", () => {
  let t: ReturnType<typeof build>;

  beforeEach(() => {
    t = build();
  });

  it("updateProfile persists the image URL", async () => {
    const user = await makeUser(t, "pictured@test.dev");
    await t.service.updateProfile(user.id, {
      image: "https://cdn.test.dev/users/u1/avatar/me.png",
    });
    const me = await t.service.getMe(PRIVATE, user.id);
    expect(me.profile.image).toBe("https://cdn.test.dev/users/u1/avatar/me.png");
  });
});

describe("identifier management", () => {
  let t: ReturnType<typeof build>;

  beforeEach(() => {
    t = build();
  });

  it("removing the ONLY identifier is a 400 with the friendly message", async () => {
    const user = await makeUser(t, "solo@test.dev");
    await expect(
      t.service.removeIdentifier(PRIVATE, user.id, {
        type: "email",
        value: "solo@test.dev",
      }),
    ).rejects.toThrow(/400:.*at least one login identifier/);
  });

  it("exceeding the email cap is a 400, not a 500", async () => {
    const user = await makeUser(t, "capped@test.dev");
    await t.service.addIdentifier(PRIVATE, user.id, {
      type: "email",
      value: "second@test.dev",
    });
    await t.service.addIdentifier(PRIVATE, user.id, {
      type: "email",
      value: "third@test.dev",
    });
    await expect(
      t.service.addIdentifier(PRIVATE, user.id, {
        type: "email",
        value: "fourth@test.dev",
      }),
    ).rejects.toThrow(/400:.*limit/);
  });

  it("adding an identifier that belongs to anyone is a 400", async () => {
    const user = await makeUser(t, "ana@test.dev");
    await makeUser(t, "taken@test.dev");
    await expect(
      t.service.addIdentifier(PRIVATE, user.id, {
        type: "email",
        value: "taken@test.dev",
      }),
    ).rejects.toThrow(/400:.*already in use/);
  });

  it("a removable identifier still comes off", async () => {
    const user = await makeUser(t, "keep@test.dev");
    await t.service.addIdentifier(PRIVATE, user.id, {
      type: "email",
      value: "extra@test.dev",
    });
    await t.service.removeIdentifier(PRIVATE, user.id, {
      type: "email",
      value: "extra@test.dev",
    });
    const me = await t.service.getMe(PRIVATE, user.id);
    expect(me.identifiers.map((i) => i.value)).toEqual(["keep@test.dev"]);
  });

  it("adds and verifies a phone via the code-login proof, minting no session", async () => {
    const user = await makeUser(t, "phoned@test.dev");
    const { verificationFlowId } = await t.service.addIdentifier(PRIVATE, user.id, {
      type: "phone",
      value: "+351911111111",
    });
    const sessionsBefore = [...t.port.sessions.values()].filter(
      (s) => s.active,
    ).length;

    await t.service.verifyIdentifier(PRIVATE, user.id, {
      flowId: verificationFlowId,
      code: FAKE_CODE,
      type: "phone",
      value: "+351911111111",
    });

    const me = await t.service.getMe(PRIVATE, user.id);
    const phone = me.identifiers.find((i) => i.value === "+351911111111");
    expect(phone?.verified).toBe(true);
    // possession proof runs through a code login — its session is discarded
    const sessionsAfter = [...t.port.sessions.values()].filter(
      (s) => s.active,
    ).length;
    expect(sessionsAfter).toBe(sessionsBefore);
  });

  it("re-adding the caller's own unverified identifier restarts verification", async () => {
    const user = await makeUser(t, "resend@test.dev");
    await t.service.addIdentifier(PRIVATE, user.id, {
      type: "phone",
      value: "+351922222222",
    });
    // same POST again — acts as "resend the code", not a duplicate error
    const again = await t.service.addIdentifier(PRIVATE, user.id, {
      type: "phone",
      value: "+351922222222",
    });
    expect(again.verificationFlowId).toBeTruthy();
    const me = await t.service.getMe(PRIVATE, user.id);
    expect(
      me.identifiers.filter((i) => i.value === "+351922222222"),
    ).toHaveLength(1);
  });

  it("removing an address that isn't on the caller's account is a 400", async () => {
    const user = await makeUser(t, "mine2@test.dev");
    await makeUser(t, "theirs@test.dev");
    await expect(
      t.service.removeIdentifier(PRIVATE, user.id, {
        type: "email",
        value: "theirs@test.dev",
      }),
    ).rejects.toThrow(/400:.*not on this account/);
  });

  it("verifying an address that isn't on the caller's account is a 400", async () => {
    const user = await makeUser(t, "prover@test.dev");
    await makeUser(t, "victim@test.dev");
    await expect(
      t.service.verifyIdentifier(PRIVATE, user.id, {
        flowId: "any-flow",
        code: FAKE_CODE,
        type: "email",
        value: "victim@test.dev",
      }),
    ).rejects.toThrow(/400:.*not on this account/);
  });

  it("re-adding the caller's own VERIFIED identifier is a 400", async () => {
    const user = await makeUser(t, "mine@test.dev");
    await expect(
      t.service.addIdentifier(PRIVATE, user.id, {
        type: "email",
        value: "mine@test.dev",
      }),
    ).rejects.toThrow(/400:.*already added and verified/);
  });
});
