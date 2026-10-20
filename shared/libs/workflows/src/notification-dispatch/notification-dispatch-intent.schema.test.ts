import { describe, expect, it } from "vitest";
import { notificationDispatchIntentSchema } from "./notification-dispatch-intent.schema";

describe("notificationDispatchIntentSchema", () => {
  it("accepts a payload with only deliveryId", () => {
    expect(
      notificationDispatchIntentSchema.parse({ deliveryId: "d_1" }),
    ).toEqual({
      deliveryId: "d_1",
    });
  });

  it("rejects extra fields (PHI guard)", () => {
    expect(() =>
      notificationDispatchIntentSchema.parse({
        deliveryId: "d_1",
        patientName: "X",
      }),
    ).toThrow();
  });

  it("rejects an empty deliveryId", () => {
    expect(() =>
      notificationDispatchIntentSchema.parse({ deliveryId: "" }),
    ).toThrow();
  });
});
