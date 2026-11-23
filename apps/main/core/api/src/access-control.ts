// Scoped access-control wiring — the once-only engine + gated-db init for this
// app (SCF10: once-only init at src/ root; SCF11: wiring lives in the app shell).
// The engine and gate are config-bound singletons, exactly like the db pool in
// db.ts — assembled here from config + drizzle tables, injected into the module
// at mount. This is the ONE place that names the app's tables by the config's
// entity vocabulary, so these keys MUST match @configs/access-control exactly.
import {
  createAc,
  createGatedDb,
  type SchemaTables,
} from "@libs/gated-scoped-ac";
import { accessControlConfig } from "@configs/access-control";
import { db } from "@/db";
import {
  creditAccount,
  creditLot,
  memberAllowance,
  paymentAccount,
  paymentProduct,
  uomConsentRecord,
  uomInvitation,
  uomLegalDocument,
  uomMembership,
  uomOrganization,
  uomUser,
  uomUserContact,
  uomUserPreferences,
  uomUserProfile,
} from "@/models";
import { documentLock } from "@modules/collaboration/models";
import { meteor } from "@product/implementation-patterns/models";

// entity name (config vocabulary) → drizzle table. Typed at the lib's base
// `SchemaTables` so the injected engine/gate stay app-shape-agnostic (AC37); the
// engine keys rules/scopes by these names.
const tables: SchemaTables = {
  organization: uomOrganization,
  membership: uomMembership,
  invitation: uomInvitation,
  user: uomUser,
  user_profile: uomUserProfile,
  user_preferences: uomUserPreferences,
  user_contact: uomUserContact,
  legal_document: uomLegalDocument,
  consent_record: uomConsentRecord,
  // credits: the owner's account, a member's own cap. Lots and the ledger are
  // children of the account — proven on the parent; the platform owner's admin
  // grants are a create on a lot.
  credit_account: creditAccount,
  member_allowance: memberAllowance,
  credit_lot: creditLot,
  // payment: the owner's account, a vendor's products. The payment ledger and
  // purchases are children of the account — proven on the parent.
  payment_account: paymentAccount,
  product: paymentProduct,
  meteor,
  document_lock: documentLock,
};

// createAc mints Scopes + resolves permissions; createGatedDb owns the raw db
// handle and is the sole DB path (its handle requires a Scope). orgTypePath is
// left at its default `$session.organization.type` — the shape the hydration
// middleware builds into the bag.
//
// `idColumns`: `user_profile` and `user_preferences` are keyed by `userId` (no
// `id` column — each row IS its user's, UOM4), so the gate must match their
// fused writes on `user_id`. Every other entity keeps the default `id`.
export const acEngine = createAc({ ...accessControlConfig, tables });
const gateDeps = {
  tables,
  engine: acEngine,
  idColumns: {
    user_profile: "userId",
    user_preferences: "userId",
  },
};

export const gatedDb = createGatedDb(db, gateDeps);

/** The same gate over another handle of the db: the meteors' runs over a db that versions the meteor table. */
export const createGatedDbOver = (overDb: typeof db) => createGatedDb(overDb, gateDeps);

// Roles every authenticated user always holds (the account baseline). Derived
// from config here — the module stays config-blind (AC37) and just unions these
// into each request's role set so baseline permissions actually apply.
export const baselineRoles = accessControlConfig.accountBaseline.map(
  (node) => node.role,
);
