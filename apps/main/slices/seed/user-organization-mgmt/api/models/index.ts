// Aggregate model export — the package's `./models` entry. The consuming app
// re-exports these so drizzle-kit sees the module's tables.

export * from "./user.model";
export * from "./user.schemas";
export * from "./user-preferences.model";
export * from "./user-preferences.schemas";
export * from "./legal.model";
export * from "./consent-record.model";
export * from "./legal.schemas";
export * from "./organization.model";
export * from "./organization.schemas";
export * from "./membership.model";
export * from "./invitation.model";
export * from "./invitation.schemas";
export * from "./identity.model";
