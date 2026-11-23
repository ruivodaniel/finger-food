/**
 * Atomic Seed Script: Create Organization
 *
 * Inserts an organization row of any configured org type (including
 * developer-actor types like system_admin — this is a test seed, the bypass
 * is the point) and makes userId a member with the type's configured owner
 * role (falls back to no roles when the type has no ownership block; tests
 * assign roles explicitly via add-member).
 *
 * The module's `organization` table has no slug column — `slug` is accepted
 * and echoed back for contract compatibility, not stored.
 *
 * Input:  { name: string, slug: string, type: string, userId: string }
 * Output: { id: string, name: string, slug: string, type: string }
 *
 * Usage by engine:
 *   script.run("apps/main/api/scripts/e2e/create-organization.ts", {
 *     name: "System Admin",
 *     slug: "system-admin",
 *     type: "system_admin",
 *     userId: "user-123"
 *   })
 */

import { createId } from "@paralleldrive/cuid2";
import { organizationCreationAndJoining } from "@configs/user-organization-mgmt/auth/org-lifecycle.config";
import { uomMembership, uomOrganization } from "@modules/user-organization-mgmt/models";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

interface Args {
  name: string;
  slug: string;
  /** Org-type id from the lifecycle config (system_admin | platform_admin | company | …). */
  type: string;
  userId: string;
}

async function main() {
  const argsJson = process.env.SCRIPT_ARGS || process.argv[2] || "{}";
  const args: Args = JSON.parse(argsJson);

  if (!args.name || !args.slug || !args.type || !args.userId) {
    throw new Error("Required args: name, slug, type, userId");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const dbClient = new Client({ connectionString });
  await dbClient.connect();
  const db = drizzle(dbClient);

  const now = new Date();
  const orgId = createId();
  await db.insert(uomOrganization).values({
    id: orgId,
    type: args.type,
    name: args.name,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  });

  const entry = organizationCreationAndJoining.find(
    (candidate) => candidate.orgType === args.type,
  );
  const ownerRole = entry?.creation.ownership?.membershipOwnerRole ?? null;
  await db.insert(uomMembership).values({
    id: `member-${args.userId}-${orgId}`,
    organizationId: orgId,
    userId: args.userId,
    roles: ownerRole ? [ownerRole] : [],
    createdAt: now,
    updatedAt: now,
  });

  await dbClient.end();

  console.log(
    JSON.stringify({ id: orgId, name: args.name, slug: args.slug, type: args.type }),
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
