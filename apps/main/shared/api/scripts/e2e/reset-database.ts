/**
 * Atomic Seed Script: Reset Database
 *
 * Truncates the uom module's tables and deletes all Kratos identities —
 * without the identity wipe, re-running registration flows 400s on
 * already-taken identifiers.
 *
 * Input:  none (DATABASE_URL required; KRATOS_ADMIN_URL optional)
 * Output: { success: true }
 *
 * Usage by engine:
 *   script.run("apps/main/api/scripts/e2e/reset-database.ts")
 */

import { Client } from "pg";

const KRATOS_ADMIN_URL =
  process.env.KRATOS_ADMIN_URL ?? "http://localhost:4434";

async function wipeKratosIdentities(): Promise<void> {
  // Page until empty — deleting shifts pages, so always re-fetch page one.
  for (;;) {
    const res = await fetch(
      `${KRATOS_ADMIN_URL}/admin/identities?per_page=250`,
    );
    if (!res.ok) {
      throw new Error(`kratos admin list failed: ${res.status}`);
    }
    const identities = (await res.json()) as Array<{ id: string }>;
    if (identities.length === 0) return;
    for (const identity of identities) {
      const del = await fetch(
        `${KRATOS_ADMIN_URL}/admin/identities/${identity.id}`,
        { method: "DELETE" },
      );
      if (!del.ok && del.status !== 404) {
        throw new Error(`kratos identity delete failed: ${del.status}`);
      }
    }
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const dbClient = new Client({ connectionString });
  await dbClient.connect();

  await dbClient.query(`
    TRUNCATE TABLE
      "invitation",
      "member",
      "organization",
      "consent_record",
      "legal_document",
      "user_contacts",
      "user_profile",
      "user"
    CASCADE;
  `);

  await dbClient.end();
  await wipeKratosIdentities();

  console.log(JSON.stringify({ success: true }));
  process.exit(0);
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
