// The collaboration slice's public web surface: what the core and other slices may import. Another slice may use what is
// exported here, components and application services; never a hook, the store or a helper.
export { mountCollaborationWeb } from "./services/application/mount";
export type { CollaborationHttp, CollaborationRealtime, MountCollaborationWebOptions } from "./services/application/mount";
export { HeldBy } from "./shared/components/HeldBy";
export { HeldToast } from "./shared/components/HeldToast";
export { PresenceBar } from "./shared/components/PresenceBar";
export { EditingNow } from "./shared/components/EditingNow";
export { liveDocumentsService } from "./services/application/live-documents.service";
export type { CollaborationState, DocumentShape, HeldByOther, LiveDocumentSource, LiveDocumentView } from "./services/application/live-documents.service";
export { locksService } from "./services/application/locks.service";
export { LockToggle } from "./shared/components/LockToggle";
export { getCollaborationRoutes } from "./routes/get-routes";
export type { GetCollaborationRoutesOptions } from "./routes/get-routes";
