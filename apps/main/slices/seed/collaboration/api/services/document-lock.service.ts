/**
 * Document lock service — a document frozen until someone allowed unlocks it. Who may see, lock and unlock is the app's
 * access rules on `document_lock`: this service asks the engine for the verdict and the Scopes, the repository runs them
 * through the gate, and the service raises the errors. Only a kind a slice plugged in can be locked.
 */
import type { Ac, GatedDb, Private, SchemaTables, ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { DocumentLockSelect } from "../models/document-lock.model";
import type { LockListQuery } from "../models/collaboration.schemas";
import type { DrizzleDocumentLockRepository } from "../repositories/document-lock.repository";
import type { Actor } from "../mount-types";
import type { ModuleErrors } from "../shared/module-errors";
import type { CollaborationService } from "./collaboration.service";
import type { DocumentLockPage, DocumentLockState, DocumentLockView } from "../../shared/types";

export interface DocumentLockServiceDeps {
  lockRepo: DrizzleDocumentLockRepository;
  /** The kinds slices plugged in: only those can be locked, and they title the locks list. A live document hears of its
   * lock and unlock. */
  collaboration: Pick<CollaborationService, "getKind" | "applyLock">;
  /** The app's engine: the verdicts and Scopes on document_lock. */
  engine: Pick<Ac, "allowCreate" | "resolveRead" | "resolveDelete">;
  /** The app's gated-db factory: a bag-bound handle per request. */
  gatedDb: (bag: unknown) => GatedDb<SchemaTables>;
  actorOf: (actorId: string) => Promise<Actor>;
  errors: ModuleErrors;
}

export class DocumentLockService {
  private readonly deps: DocumentLockServiceDeps;

  constructor(deps: DocumentLockServiceDeps) {
    this.deps = deps;
  }

  /** A document's lock, if the caller may see it, and whether they may lock or unlock it. */
  async getState(ac: ScopedAcRequestContext, visibility: Private, kind: string, documentId: string): Promise<DocumentLockState> {
    this.requireKind(kind);
    const lock = await this.findLock(ac, visibility, kind, documentId);
    if (lock) {
      const scope = this.deps.engine.resolveDelete(ac.permissions, "document_lock", ac.bag);
      const deletable = await this.deps.lockRepo.findByIdsWhereCanDelete(visibility, [lock.id], scope, this.deps.gatedDb(ac.bag));
      return { lock: (await this.toViews(kind, [lock]))[0]!, canLock: false, canUnlock: deletable.length > 0 };
    }
    // the in-memory verdict: the role and the context. Whether the document is the caller's company's is the payload's
    // probe, which runs when they lock; a caller who sees the document's page can already read it.
    const verdict = this.deps.engine.allowCreate(ac.permissions, "document_lock", { ...(ac.bag as object), requestBody: { kind, documentId } });
    return { lock: null, canLock: verdict.allow, canUnlock: false };
  }

  /** The locks the caller may see among these documents of a kind: one query, for a list that marks what is locked. */
  async getLocksOf(ac: ScopedAcRequestContext, visibility: Private, kind: string, documentIds: string[]): Promise<DocumentLockView[]> {
    this.requireKind(kind);
    const scope = this.deps.engine.resolveRead(ac.permissions, "document_lock", ac.bag);
    const locks = await this.deps.lockRepo.findByDocumentIds(visibility, kind, documentIds, scope, this.deps.gatedDb(ac.bag));
    return this.toViews(kind, locks);
  }

  /** Freezes a document. Already locked: a conflict. The rules refuse it: forbidden. */
  async lock(ac: ScopedAcRequestContext, visibility: Private, kind: string, documentId: string, lockedBy: string): Promise<DocumentLockView> {
    this.requireKind(kind);
    if (await this.findLock(ac, visibility, kind, documentId)) throw this.deps.errors.conflict(`${kind} ${documentId} is already locked`);
    const verdict = this.deps.engine.allowCreate(ac.permissions, "document_lock", { ...(ac.bag as object), requestBody: { kind, documentId } });
    if (!verdict.allow) throw this.deps.errors.forbidden(verdict.reason ?? "cannot lock this document");
    let created: DocumentLockSelect | null;
    try {
      created = await this.deps.lockRepo.create(visibility, { kind, documentId, lockedBy }, ac.permissions, this.deps.gatedDb(ac.bag));
    } catch (error) {
      // one lock per document: someone locked it in between
      if (isUniqueViolation(error)) throw this.deps.errors.conflict(`${kind} ${documentId} is already locked`);
      throw error;
    }
    // null ⇒ the gate refused it: the document isn't one the caller may lock
    if (!created) throw this.deps.errors.forbidden("cannot lock this document");
    const view = (await this.toViews(kind, [created]))[0]!;
    await this.deps.collaboration.applyLock(kind, documentId, view);
    return view;
  }

  /** Unfreezes a document. No lock the caller sees: not found. The rules refuse it: forbidden. */
  async unlock(ac: ScopedAcRequestContext, visibility: Private, kind: string, documentId: string): Promise<void> {
    this.requireKind(kind);
    const lock = await this.findLock(ac, visibility, kind, documentId);
    if (!lock) throw this.deps.errors.notFound(`${kind} ${documentId} isn't locked`);
    const scope = this.deps.engine.resolveDelete(ac.permissions, "document_lock", ac.bag);
    const removed = await this.deps.lockRepo.delete(visibility, lock.id, scope, this.deps.gatedDb(ac.bag));
    if (!removed) throw this.deps.errors.forbidden("cannot unlock this document");
    await this.deps.collaboration.applyLock(kind, documentId, null);
  }

  /** A document's lock as stored, whoever asks: what a live document reads of itself, and what its owner checks before a
   * write of its own. */
  async getCurrentLock(kind: string, documentId: string): Promise<DocumentLockView | null> {
    const [lock] = await this.deps.lockRepo.findByDocumentIdsUngated(kind, [documentId]);
    return lock ? (await this.toViews(kind, [lock]))[0]! : null;
  }

  /** The page of locks the caller may see: a company's, or, for a system admin, every one; each says whether the caller
   * may unlock it. */
  async getAll(ac: ScopedAcRequestContext, visibility: Private, query: LockListQuery): Promise<DocumentLockPage> {
    const scope = this.deps.engine.resolveRead(ac.permissions, "document_lock", ac.bag);
    const gateDb = this.deps.gatedDb(ac.bag);
    const { rows, total } = await this.deps.lockRepo.findAll(visibility, query, scope, gateDb);
    const deleteScope = this.deps.engine.resolveDelete(ac.permissions, "document_lock", ac.bag);
    const unlockable = new Set((await this.deps.lockRepo.findByIdsWhereCanDelete(visibility, rows.map((row) => row.id), deleteScope, gateDb)).map((row) => row.id));
    const byKind = new Map<string, DocumentLockSelect[]>();
    for (const row of rows) byKind.set(row.kind, [...(byKind.get(row.kind) ?? []), row]);
    const views = new Map<string, DocumentLockView>();
    for (const [kind, locks] of byKind) for (const view of await this.toViews(kind, locks)) views.set(view.id, view);
    return { rows: rows.map((row) => ({ ...views.get(row.id)!, canUnlock: unlockable.has(row.id) })), total };
  }

  private requireKind(kind: string): void {
    if (!this.deps.collaboration.getKind(kind)) throw this.deps.errors.notFound(`no collaborative kind ${kind}`);
  }

  /** The document's lock, if the read Scope admits it. */
  private async findLock(ac: ScopedAcRequestContext, visibility: Private, kind: string, documentId: string): Promise<DocumentLockSelect | undefined> {
    const scope = this.deps.engine.resolveRead(ac.permissions, "document_lock", ac.bag);
    const [lock] = await this.deps.lockRepo.findByDocumentIds(visibility, kind, [documentId], scope, this.deps.gatedDb(ac.bag));
    return lock;
  }

  /** Locks of one kind, with their documents' titles and who locked them. */
  private async toViews(kind: string, locks: DocumentLockSelect[]): Promise<DocumentLockView[]> {
    const titles = (await this.deps.collaboration.getKind(kind)?.titlesOf?.(locks.map((lock) => lock.documentId))) ?? new Map<string, string>();
    const names = new Map(await Promise.all([...new Set(locks.map((lock) => lock.lockedBy))].map(async (id) => [id, (await this.deps.actorOf(id)).name] as const)));
    return locks.map((lock) => ({
      id: lock.id, kind: lock.kind, documentId: lock.documentId, title: titles.get(lock.documentId) ?? null,
      lockedBy: lock.lockedBy, lockedByName: names.get(lock.lockedBy) ?? lock.lockedBy, lockedAt: lock.createdAt.toISOString(),
    }));
  }
}

/** Postgres's unique violation, through any driver. */
function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string; cause?: { code?: string } } | null)?.code ?? (error as { cause?: { code?: string } } | null)?.cause?.code;
  return code === "23505";
}
