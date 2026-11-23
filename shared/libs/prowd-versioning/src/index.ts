// Public API of @libs/prowd-versioning: the factory, the capsule table
// definitions the app migrates and injects, and the types.
export { createVersioning, MAIN } from "./versioning";
export type { Author, Handle, Row, VersionedEntry, VersionedMap, Versioning, VersioningConfig, View } from "./versioning";
export { branch, capsuleTables, innerCapsule, outerCapsule, versionDelta } from "./schema";
export type { CapsuleTables, FieldDelta } from "./schema";
