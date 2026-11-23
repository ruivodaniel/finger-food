// The collaboration slice's public server surface: what the core and the slices that plug in import.
export { mountCollaborationApi } from "./mount";
export type { Actor, CollaborativeKind, DocumentRooms, MountCollaborationApiOptions, MountCollaborationApiResult } from "./mount-types";
export type { CollaborationService } from "./services/collaboration.service";
export type { DocumentLockService } from "./services/document-lock.service";
export type { CollaborationEnv } from "./types";
export type { ModuleErrors } from "./shared/module-errors";
