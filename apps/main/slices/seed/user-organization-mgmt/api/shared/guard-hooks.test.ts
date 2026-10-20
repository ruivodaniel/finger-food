import { describe, expect, it, vi } from "vitest";
import { guardHooks } from "./guard-hooks";
import type { ModuleLogger } from "./module-errors";

function collectingLogger(): ModuleLogger & {
  errors: Array<{ message: string; meta?: Record<string, unknown> }>;
} {
  const errors: Array<{ message: string; meta?: Record<string, unknown> }> = [];
  return {
    errors,
    info: () => undefined,
    warn: () => undefined,
    error: (message, meta) => errors.push({ message, meta }),
  };
}

describe("guardHooks", () => {
  it("passes arguments through and resolves", async () => {
    const logger = collectingLogger();
    const onUserUpdated = vi.fn().mockResolvedValue(undefined);

    const hooks = guardHooks({ onUserUpdated }, logger);
    await hooks.onUserUpdated?.({ userId: "u1" });

    expect(onUserUpdated).toHaveBeenCalledWith({ userId: "u1" });
    expect(logger.errors).toHaveLength(0);
  });

  it("swallows a rejecting callback and logs it under the hook's name", async () => {
    const logger = collectingLogger();
    const hooks = guardHooks(
      {
        onInvitationAccepted: async () => {
          throw new Error("consumer exploded");
        },
      },
      logger,
    );

    await expect(
      hooks.onInvitationAccepted?.({
        invitationId: "i1",
        organizationId: "o1",
        orgName: "Acme",
        inviterUserId: "u1",
        accepterUserId: "u2",
        accepterName: null,
        role: "company_standard",
      } as never),
    ).resolves.toBeUndefined();

    expect(logger.errors).toHaveLength(1);
    expect(logger.errors[0].message).toBe("hook consumer failed");
    expect(logger.errors[0].meta).toMatchObject({
      hook: "onInvitationAccepted",
      errorMessage: "consumer exploded",
    });
  });

  it("swallows a synchronously-throwing callback too", async () => {
    const logger = collectingLogger();
    const hooks = guardHooks(
      {
        onUserUpdated: () => {
          throw new Error("sync boom");
        },
      },
      logger,
    );

    await expect(
      hooks.onUserUpdated?.({ userId: "u1" }),
    ).resolves.toBeUndefined();
    expect(logger.errors[0].meta).toMatchObject({ hook: "onUserUpdated" });
  });

  it("leaves absent hooks absent", () => {
    const hooks = guardHooks({}, collectingLogger());
    expect(hooks.onUserRegistered).toBeUndefined();
  });
});
