/**
 * mountCollaborationApi — the slice's one assembly point: service → router, from what the app hands it.
 */
import { DrizzleDocumentLockRepository } from "./repositories/document-lock.repository";
import { createCollaborationRouter } from "./routes/create-collaboration-router";
import { createLocksRouter } from "./routes/create-locks-router";
import { CollaborationService } from "./services/collaboration.service";
import { DocumentLockService } from "./services/document-lock.service";
import { LiveDocuments } from "./shared/live-documents";
import type { MountCollaborationApiOptions, MountCollaborationApiResult } from "./mount-types";
import type { DocumentLockView } from "../shared/types";

export function mountCollaborationApi(options: MountCollaborationApiOptions): MountCollaborationApiResult {
  // the two services reach each other: a live document reads its lock from the locks, and the locks tell it of a change
  const lockOf = (kind: string, id: string): Promise<DocumentLockView | null> => lockService.getCurrentLock(kind, id);
  const collaborationService = new CollaborationService({ liveDocuments: new LiveDocuments(), rooms: options.rooms, actorOf: options.actorOf, lockOf, errors: options.errors, quietMs: options.quietMs, capMs: options.capMs, leaseMs: options.leaseMs });
  const lockService = new DocumentLockService({
    lockRepo: new DrizzleDocumentLockRepository(options.createId, options.gatedDb.ungated()),
    collaboration: collaborationService,
    engine: options.engine,
    gatedDb: options.gatedDb,
    actorOf: options.actorOf,
    errors: options.errors,
  });
  const router = createCollaborationRouter({ collaborationService, errors: options.errors });
  router.route("/locks", createLocksRouter({ lockService, errors: options.errors }));
  return { router, services: { collaboration: collaborationService, locks: lockService } };
}
