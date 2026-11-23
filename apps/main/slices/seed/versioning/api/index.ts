// The versioning slice's public server surface: what the core imports. Everything else under api/ is internal.
export { mountVersioningApi } from "./mount";
export type { AccessAction, EntityAccess, MountVersioningApiOptions, MountVersioningApiResult, VersioningDb } from "./mount-types";
export type { VersionedDbFor, VersionedDbForOptions } from "./shared/versioned-db";
export type { ModuleErrors } from "./shared/module-errors";
export type { VersioningEnv } from "./types";
