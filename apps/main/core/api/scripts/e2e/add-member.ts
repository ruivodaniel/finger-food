/**
 * Atomic Seed Script: Add Member to Organization
 *
 * Upserts a membership with the given scoped roles — the module's `member`
 * row stores them directly as `roles text[]` (no translation layer).
 *
 * Input:  { userId: string, orgId: string, scopedRoles: string[], orgType?: string }
 * Output: { memberId: string, userId: string, orgId: string, scopedRoles: string[] }
 *
 * Usage by engine:
 *   script.run("apps/main/api/scripts/e2e/add-member.ts", {
 *     userId: "user-123",
 *     orgId: "org-456",
 *     scopedRoles: ["system_admin_owner"]
 *   })
 */

import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { uomMembership } from "@modules/user-organization-mgmt/models";

interface Args {
  userId: string;
  orgId: string;
  scopedRoles: string[];
  orgType?: string;
}

async function main() {
  const argsJson = process.env.SCRIPT_ARGS || process.argv[2] || "{}";
  const args: Args = JSON.parse(argsJson);

  if (!args.userId || !args.orgId || !args.scopedRoles) {
    throw new Error("Required args: userId, orgId, scopedRoles");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const dbClient = new Client({ connectionString });
  await dbClient.connect();
  const db = drizzle(dbClient);

  const now = new Date();
  const [existing] = await db
    .select()
    .from(uomMembership)
    .where(
      and(
        eq(uomMembership.organizationId, args.orgId),
        eq(uomMembership.userId, args.userId),
        isNull(uomMembership.deletedAt),
      ),
    )
    .limit(1);

  let memberId: string;
  if (existing) {
    memberId = existing.id;
    await db
      .update(uomMembership)
      .set({ roles: args.scopedRoles, updatedAt: now })
      .where(eq(uomMembership.id, memberId));
  } else {
    memberId = `member-${args.userId}-${args.orgId}`;
    await db.insert(uomMembership).values({
      id: memberId,
      organizationId: args.orgId,
      userId: args.userId,
      roles: args.scopedRoles,
      createdAt: now,
      updatedAt: now,
    });
  }

  await dbClient.end();

  console.log(
    JSON.stringify({
      memberId,
      userId: args.userId,
      orgId: args.orgId,
      scopedRoles: args.scopedRoles,
    }),
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
