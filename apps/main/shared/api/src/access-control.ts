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
export const gatedDb = createGatedDb(db, {
  tables,
  engine: acEngine,
  idColumns: {
    user_profile: "userId",
    user_preferences: "userId",
  },
});

// Roles every authenticated user always holds (the account baseline). Derived
// from config here — the module stays config-blind (AC37) and just unions these
// into each request's role set so baseline permissions actually apply.
export const baselineRoles = accessControlConfig.accountBaseline.map(
  (node) => node.role,
);
