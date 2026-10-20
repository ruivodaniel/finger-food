// re-exports only (module + feature models) — declares nothing (SCF7).
// `db.ts` does `import * as schema` over this barrel and drizzle.config.ts
// points its schema at this directory, so everything re-exported here is what
// the db client and drizzle-kit see. Feature models join here when they mount.
export * from "@modules/user-organization-mgmt/models";
export * from "@modules/notifications/models";
export * from "@modules/finger-food/models";
// Relative, not `@/…`: this barrel is read from outside the app too (drizzle-kit,
// the cockpit's ERD generator), where the app's path alias doesn't exist.
export * from "../workflow-intents/workflow-intent.model";
