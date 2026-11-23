// Public API of the versioning library: the factory and the types. The capsule
// tables are not here: the app defines them (the versioning slice's models) and
// injects them into createVersioning in the CapsuleTables shape.
export { BranchArchived, createVersioning, defineVersionedEntity, MAIN, StaleHead, VersionNotFound } from "./versioning";
export { createVersionedDb } from "./versioned-db";
export type { VersionableDb, VersionedDbOptions } from "./versioned-db";
export type { Author, Handle, Intent, Row, VersionedEntry, Versioning, VersioningConfig, View, WriteOptions } from "./versioning";
export type { CapsuleTables, FieldDelta, InnerCapsuleRow } from "./types";
