/**
 * Atomic Seed Script: Create User
 *
 * Provisions a Kratos identity (email pre-verified, password set) plus the
 * app user row + profile, through the app's own mount (identity port +
 * services) — the same assembly the server runs.
 *
 * Input:  { email: string, password: string, name: string }
 * Output: { id: string, email: string, name: string }   (id = app user row id)
 *
 * Usage by engine:
 *   script.run("apps/main/api/scripts/e2e/create-user.ts", {
 *     email: "owner@test.com",
 *     password: "Test123!",
 *     name: "Owner"
 *   })
 */

import { userOrg } from "../../src/mounts";
import { closeDb } from "../../src/db";

interface Args {
  email: string;
  password: string;
  name: string;
}

async function main() {
  const argsJson = process.env.SCRIPT_ARGS || process.argv[2] || "{}";
  const args: Args = JSON.parse(argsJson);

  if (!args.email || !args.password || !args.name) {
    throw new Error("Required args: email, password, name");
  }

  const existing = await userOrg.identityProvider.findByIdentifier(args.email);
  const identityId =
    existing?.id ??
    (
      await userOrg.identityProvider.createIdentity({
        traits: { email: args.email, name: args.name },
        password: args.password,
        verifiedEmails: [args.email],
      })
    ).identityId;

  const user = await userOrg.services.user.findOrCreateByIdentityId(identityId);
  await userOrg.services.user.updateProfile(user.id, { name: args.name });

  await closeDb();
  console.log(
    JSON.stringify({ id: user.id, email: args.email, name: args.name }),
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
