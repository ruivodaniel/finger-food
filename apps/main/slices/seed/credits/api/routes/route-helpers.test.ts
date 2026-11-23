import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { CreditGrantSchema } from "../models/credits.schemas";
import type { ModuleErrors } from "../shared/module-errors";
import { validate } from "./route-helpers";

// the app turns a slice's bad request into { error: message }; this stands in for it
class BadRequest extends Error {}
const errors = { badRequest: (message?: string) => new BadRequest(message) } as unknown as ModuleErrors;

const app = new Hono()
  .post("/grants", validate("json", CreditGrantSchema, errors), (c) => c.json(c.req.valid("json")))
  .onError((error, c) => c.json({ error: error.message }, error instanceof BadRequest ? 400 : 500));

const post = (body: unknown) => app.request("/grants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("validate", () => {
  it("lets a well-shaped request through, parsed", async () => {
    const response = await post({ owner: { userId: "u1" }, amount: 100, services: null, expiresAt: null, priority: 1 });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ owner: { userId: "u1" }, amount: 100 });
  });

  it("refuses a wrong shape as a bad request whose reason names the field, in words", async () => {
    const response = await post({ owner: { userId: "u1" }, amount: "many", priority: 9 });
    expect(response.status).toBe(400);
    const { error } = (await response.json()) as { error: string };
    expect(typeof error).toBe("string");
    expect(error).toContain("amount: ");
    expect(error).toContain("priority: ");
  });
});
