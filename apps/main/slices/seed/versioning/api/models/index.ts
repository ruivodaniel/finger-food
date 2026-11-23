// The slice's tables — the package's ./models entry. The core re-exports these so drizzle-kit and the db client see
// them, and injects the four capsule tables into createVersioning.
import type { CapsuleTables } from "@libs/versioning";
import { branch } from "./branch.model";
import { innerCapsule } from "./inner-capsule.model";
import { outerCapsule } from "./outer-capsule.model";
import { versionDelta } from "./version-delta.model";

export * from "./outer-capsule.model";
export * from "./branch.model";
export * from "./inner-capsule.model";
export * from "./version-delta.model";
export * from "./release.model";
export * from "./outer-capsule.schemas";
export * from "./branch.schemas";
export * from "./inner-capsule.schemas";
export * from "./version-delta.schemas";
export * from "./release.schemas";
export * from "./versioning.schemas";

/** The capsule tables in the shape the versioning library asks for. */
export const capsuleTables = { outerCapsule, branch, innerCapsule, versionDelta } satisfies CapsuleTables;
