// Public API surface — what a consuming app imports. Everything else under
// api/ is slice-internal.

export { mountImplementationPatternsApi } from "./mount";
export { meteorVersionedEntry } from "./shared/meteor-versioning";
export type { MeteorFieldChange, MeteorLiveDocument } from "./shared/meteor-live-document";
export type { MeteorFields } from "./services/meteor.service";
export type { MountImplementationPatternsApiOptions, MountImplementationPatternsApiResult } from "./mount-types";
export type { ImplementationPatternsEnv, ImplementationPatternsContextVariables } from "./types";
export type { ModuleErrors, ModuleLogger } from "./shared/module-errors";
