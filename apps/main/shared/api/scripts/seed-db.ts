/**
 * Dev seed — single entry (pnpm db:seed [-y]):
 *   1. drop public + drizzle schemas, run migrations from ./drizzle
 *   2. publish the platform legal documents the registration consent step needs
 *   3. provision the singleton System Admin org + owner
 *
 * Uses the app's own mount (services + identity port) — the same assembly the
 * server runs, zero deep module imports (MOD2).
 *
 * NOTE (gate): the DSL gives system_admin members standing obligations —
 * verified email + password session + TOTP. TOTP cannot be seeded, so on first
 * login the admin is 428-gated until they enroll at /account/security. That is
 * correct behavior, not a seed bug.
 */

import "dotenv/config";
import readline from "readline";
import { createId } from "@paralleldrive/cuid2";
import { eq, isNull, and } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { PRIVATE, PUBLIC } from "@libs/gated-scoped-ac";
import { uomOrganization } from "@modules/user-organization-mgmt/models";
import type { ScopedAcRequestContext } from "@modules/user-organization-mgmt/api";
import { userOrg } from "../src/mounts";
import { acEngine, baselineRoles, gatedDb } from "../src/access-control";
import { db, closeDb } from "../src/db";
import { logger } from "../src/shared/logger";

/**
 * Synthetic AC context for the seed's system actor — the same shape the
 * hydration middleware builds per request (bag from the session, roles =
 * baseline + membership). Legal-doc authoring needs `manage_legal_docs`
 * under a platform_admin org context; the org here is synthetic (no request,
 * no session), which is fine: the engine's context gates only read the bag.
 */
function makeSeedAc(): ScopedAcRequestContext {
  const bag = {
    session: {
      user: { id: "seed-script" },
      organization: { id: "seed-platform-org", type: "platform_admin" },
    },
  };
  const roles = [...baselineRoles, "manage_legal_docs"];
  return {
    bag,
    roles,
    permissions: acEngine.resolveEffectivePermissions(roles, bag),
    gateDb: gatedDb(bag),
  };
}

// Kratos runs leaked-password (haveibeenpwned) and identifier-similarity
// checks — common patterns like "Qwerty@123456" are rejected.
const ADMIN_EMAIL = "danielcastroruivo@gmail.com";
const ADMIN_NAME = "Daniel de Castro Ruivo";
const ADMIN_PASSWORD = "Altario2026!";
const ORG_NAME = "PROWD System Admin";
const OWNER_ROLE = "system_admin_owner";

const PLATFORM_LEGAL_DOCS = [
  ["termsAndConditions", "Terms and Conditions"],
  ["privacyPolicy", "Privacy Policy"],
  ["marketing", "Marketing Communications"],
] as const;

const shouldSkipConfirmation =
  process.argv.includes("-y") || process.argv.includes("--yes");

async function askToContinue(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise<string>((resolve) => {
    rl.question(
      "[WARNING] This will clear your database. Do you want to proceed? (y/n): ",
      resolve,
    );
  });
  rl.close();
  return ["yes", "y"].includes(answer.toLowerCase());
}

async function resetAndMigrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  logger.info("Dropping public + drizzle schemas...");
  await client.query(`
    DROP SCHEMA IF EXISTS public CASCADE;
    DROP SCHEMA IF EXISTS drizzle CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
  `);
  await client.end();

  logger.info("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  logger.info("Migrations complete");
}

async function seedPlatformLegalDocs() {
  const seedAc = makeSeedAc();
  for (const [type, title] of PLATFORM_LEGAL_DOCS) {
    const existing = await userOrg.services.legalDocument.getLatestVersion(
      PUBLIC,
      type,
      null,
    );
    if (existing) {
      logger.info(
        `${type}: already published (v${existing.version}) — skipped`,
      );
      continue;
    }
    const draft = await userOrg.services.legalDocument.saveDraft(
      seedAc,
      PRIVATE,
      {
        type,
        orgTypeId: null,
        title,
        contentHtml: `<h1>${title}</h1><p>Development placeholder document.</p>`,
      },
    );
    const doc = await userOrg.services.legalDocument.publishDraft(
      seedAc,
      PRIVATE,
      draft.id,
    );
    logger.info(`${type}: published v${doc.version}`);
  }
}

async function seedSystemAdmin() {
  const [existingOrg] = await db
    .select()
    .from(uomOrganization)
    .where(
      and(
        eq(uomOrganization.type, "system_admin"),
        isNull(uomOrganization.deletedAt),
      ),
    )
    .limit(1);
  if (existingOrg) {
    logger.info("system_admin org already exists — skipped");
    return;
  }

  // Identity: pre-verified email (a gate obligation) + password.
  const existing = await userOrg.identityProvider.findByIdentifier(ADMIN_EMAIL);
  const identityId =
    existing?.id ??
    (
      await userOrg.identityProvider.createIdentity({
        traits: { email: ADMIN_EMAIL, name: ADMIN_NAME },
        password: ADMIN_PASSWORD,
        verifiedEmails: [ADMIN_EMAIL],
      })
    ).identityId;

  // Through the service so the birth also seeds the default contact; the
  // module reads display names from its own profile row, not Kratos traits.
  const user = await userOrg.services.user.findOrCreateByIdentityId(identityId);
  await userOrg.services.user.updateProfile(user.id, { name: ADMIN_NAME });

  // Developer-actor provisioning: the org row goes in directly (the service
  // correctly refuses developer-actor types); membership via the service.
  const now = new Date();
  const orgId = createId();
  await db.insert(uomOrganization).values({
    id: orgId,
    type: "system_admin",
    name: ORG_NAME,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  });
  await userOrg.services.membership.addMember(PRIVATE, orgId, user.id, [
    OWNER_ROLE,
  ]);

  logger.info(`system_admin org "${ORG_NAME}" (${orgId})`);
  logger.info(`owner ${ADMIN_EMAIL} — role ${OWNER_ROLE}`);
  logger.info(
    "note: this admin is gated (428) until TOTP is enrolled in the /resolve",
  );
}

async function main() {
  const shouldContinue = shouldSkipConfirmation || (await askToContinue());
  if (!shouldContinue) {
    logger.info("Seed operation cancelled.");
    return;
  }

  logger.info("Starting seed...");
  await resetAndMigrate();
  await seedPlatformLegalDocs();
  await seedSystemAdmin();
  await closeDb();
  logger.info("Seed complete");
}

main()
  .catch((err) => {
    logger.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
