/**
 * Atomic Seed Script: Queue an email notification.
 *
 * Drives the module's queue through the app's real mount, so the REAL delivery
 * outbox runs: the delivery row and its `workflow_intent` commit in one
 * transaction, exactly as they would behind any product trigger.
 *
 * No product flow queues email yet (the only wired flow is the in-app notice on
 * invitation acceptance), so this is how a test — or a manual smoke — puts work
 * in front of the worker.
 *
 * Input:  { userId: string, email: string, organizationName?: string }
 * Output: { notificationId: string, queued: number, deliveryId: string | null }
 *
 * Usage by engine:
 *   script.run("apps/main/api/scripts/e2e/queue-email-notification.ts", {
 *     userId: "…", email: "owner@test.com"
 *   })
 */

import { invitationDeliveryEmail } from "@configs/notifications";
import { eq } from "drizzle-orm";
import { notificationDelivery } from "@/models";
import { closeDb, db } from "../../src/db";
import { notifications } from "../../src/mounts";

interface Args {
  userId: string;
  email: string;
  organizationName?: string;
}

async function main() {
  const argsJson = process.env.SCRIPT_ARGS || process.argv[2] || "{}";
  const args: Args = JSON.parse(argsJson);

  if (!args.userId || !args.email) {
    throw new Error("Required args: userId, email");
  }

  const receipt = await notifications.services.queue.queueEmail({
    template: invitationDeliveryEmail,
    args: {
      organizationName: args.organizationName ?? "Acme Notifications",
      orgTypeLabel: "Company",
      acceptUrl: "https://example.test/invitations/smoke",
    },
    to: [{ userId: args.userId, email: args.email }],
    dedupeKey: `e2e-email:${args.userId}`,
  });

  const [row] = await db
    .select({ id: notificationDelivery.id })
    .from(notificationDelivery)
    .where(eq(notificationDelivery.notificationId, receipt.notificationId));

  await closeDb();
  console.log(
    JSON.stringify({
      notificationId: receipt.notificationId,
      queued: receipt.queued,
      deliveryId: row?.id ?? null,
    }),
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
