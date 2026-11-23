/**
 * Document lock repository — data access for `document_lock`, through the gate only: a read Scope says which locks the
 * caller sees, the create verdict and its payload probe whether they may lock, the delete Scope what they may unlock.
 * The gate never throws: a refused write comes back null, and the service decides what that means. One read is ungated:
 * a live document's own lock, which freezes it for everyone, whoever asks.
 */
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { GatedDb, Private, SchemaTables, Scope } from "@libs/gated-scoped-ac";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { documentLock, type DocumentLockSelect } from "../models/document-lock.model";

export type NewDocumentLock = Pick<DocumentLockSelect, "kind" | "documentId" | "lockedBy">;

export class DrizzleDocumentLockRepository {
  private readonly createId: () => string;
  private readonly ungatedDb: Pick<PgDatabase<PgQueryResultHKT>, "select">;

  constructor(createId: () => string, ungatedDb: Pick<PgDatabase<PgQueryResultHKT>, "select">) {
    this.createId = createId;
    this.ungatedDb = ungatedDb;
  }

  /** The locks of these documents of a kind, whoever asks: what a live document reads of itself. */
  async findByDocumentIdsUngated(kind: string, documentIds: string[]): Promise<DocumentLockSelect[]> {
    if (documentIds.length === 0) return [];
    return this.ungatedDb.select().from(documentLock).where(and(eq(documentLock.kind, kind), inArray(documentLock.documentId, documentIds)));
  }

  /** The locks of these documents of a kind the read Scope admits. */
  async findByDocumentIds(visibility: Private, kind: string, documentIds: string[], scope: Scope<"document_lock", "read">, gateDb: GatedDb<SchemaTables>): Promise<DocumentLockSelect[]> {
    void visibility; // leaf
    if (documentIds.length === 0) return [];
    const rows = await gateDb.read("document_lock", scope).where(and(eq(documentLock.kind, kind), inArray(documentLock.documentId, documentIds))!).rows();
    return rows as DocumentLockSelect[];
  }

  /** The page of locks the read Scope admits, newest first; one WHERE for the page and the count. */
  async findAll(visibility: Private, query: { page: number; pageSize: number }, scope: Scope<"document_lock", "read">, gateDb: GatedDb<SchemaTables>): Promise<{ rows: DocumentLockSelect[]; total: number }> {
    void visibility; // leaf
    const [rows, total] = await Promise.all([
      gateDb.read("document_lock", scope).orderBy(desc(documentLock.createdAt), asc(documentLock.id)).limit(query.pageSize).offset((query.page - 1) * query.pageSize).rows(),
      gateDb.read("document_lock", scope).count(),
    ]);
    return { rows: rows as DocumentLockSelect[], total };
  }

  /** Inserts through the gate: the create verdict, its payload probe, the insert. Refused ⇒ null. */
  async create(visibility: Private, input: NewDocumentLock, permissions: Iterable<string>, gateDb: GatedDb<SchemaTables>): Promise<DocumentLockSelect | null> {
    void visibility; // leaf
    const row = await gateDb.create("document_lock", permissions, { ...input, id: this.createId(), createdAt: new Date() });
    return (row as DocumentLockSelect | null) ?? null;
  }

  /** The rows of these ids the delete Scope admits, without deleting: a probe. */
  async findByIdsWhereCanDelete(visibility: Private, ids: string[], scope: Scope<"document_lock", "delete">, gateDb: GatedDb<SchemaTables>): Promise<DocumentLockSelect[]> {
    void visibility; // leaf
    const found = await Promise.all(ids.map((id) => gateDb.findRowsByIdWhereCanDelete("document_lock", scope, id)));
    return found.flat() as DocumentLockSelect[];
  }

  /** Delete fused with the delete Scope. Refused or no such row ⇒ null. */
  async delete(visibility: Private, id: string, scope: Scope<"document_lock", "delete">, gateDb: GatedDb<SchemaTables>): Promise<{ id: string } | null> {
    void visibility; // leaf
    return (await gateDb.delete("document_lock", scope, id)) ?? null;
  }
}
