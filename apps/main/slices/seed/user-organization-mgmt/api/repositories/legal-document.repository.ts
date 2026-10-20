/**
 * Legal-document repository — data access for `legal_document`.
 *
 * Draft mechanics live in the row shape (see legal.model.ts): the scope's
 * draft is its highest-version row with `publishedAt = null`, so "latest"
 * queries must filter on published-ness, never just take the top version.
 *
 * `legal_document.read` splits into two branches (spec §"Known edges"): the
 * PUBLIC published lookup (`findByIds` / `findLatestVersion` — served before any
 * session exists, AC22) stays raw; the PRIVATE authoring reads (`findByIdsScoped`
 * / `findAllByScope`) run through the engine's read Scope
 * (`manage_legal_document_platform`).
 */

import { and, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  GatedDb,
  Private,
  Public,
  Scope,
  SchemaTables,
} from "@libs/gated-scoped-ac";
import type { LegalConsentType } from "../../shared/auth-config/types";
import {
  uomLegalDocument,
  type UomLegalDocumentSelect,
} from "../models/legal.model";

export interface SaveDraftRecord {
  type: LegalConsentType;
  orgTypeId: string | null;
  title: string;
  contentHtml: string;
}

export interface LegalDocumentPatch {
  title?: string;
  contentHtml?: string;
  publishedAt?: Date;
}

export interface LegalDocumentRepository {
  /** Bulk lookup — want one? pass `[id]` and read the first row. AC42: Public —
   * the PUBLIC published-document branch (`getDocumentById`) reads this and
   * filters to published (AC22); `publishDraft` (private) also reaches it for
   * its raw existence load, and Private is assignable where Public is
   * demanded. The draft-visible authoring read is `findByIdsScoped`. */
  findByIds(visibility: Public, ids: string[]): Promise<UomLegalDocumentSelect[]>;
  /** Gated bulk lookup — the draft-visible authoring read; the engine's read
   * Scope admits the rows and the gated handle executes it. AC42: private-only
   * surface (`getDocumentByIdForAuthor`). */
  findByIdsScoped(
    visibility: Private,
    ids: string[],
    scope: Scope<"legal_document", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomLegalDocumentSelect[]>;
  /** Highest PUBLISHED version for (type, orgTypeId); drafts skipped. Ungated —
   * the PUBLIC latest-published lookup (consent flows + pre-session, AC22).
   * AC42: Public — reached directly by the public `getLatestVersion` route and
   * (through `itemsWithDocuments`/`latestPublished`) by every consent flow;
   * this data is world-readable by design regardless of the caller. */
  findLatestVersion(
    visibility: Public,
    type: LegalConsentType,
    orgTypeId: string | null,
  ): Promise<UomLegalDocumentSelect | null>;
  /** The scope's draft (publishedAt null), if any — at most one by construction.
   * Ungated authoring-internal probe: feeds `saveDraft`'s edit-vs-create branch;
   * the WRITE it decides is gated. AC42: private-only surface (`saveDraft`). */
  findDraft(
    visibility: Private,
    type: LegalConsentType,
    orgTypeId: string | null,
  ): Promise<UomLegalDocumentSelect | null>;
  /** Every version for the scope, drafts included, newest first — the gated
   * authoring list. The engine's read Scope admits the rows; the display query
   * composes the (type, scope) filter + version ordering over the admitted ids.
   * AC42: private-only surface (`getVersions`). */
  findAllByScope(
    visibility: Private,
    type: LegalConsentType,
    orgTypeId: string | null,
    scope: Scope<"legal_document", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomLegalDocumentSelect[]>;
  /** Inserts the scope's next version (max over ALL rows + 1) as a draft. Plain
   * insert — the create verdict (`allowCreate`) is the service's gate (AC33).
   * AC42: private-only surface (`saveDraft`'s new-version branch). */
  create(
    visibility: Private,
    input: SaveDraftRecord,
  ): Promise<UomLegalDocumentSelect>;
  /** Scoped write-by-id — the gated handle fuses the update Scope into the
   * statement (this is where publish stamps publishedAt); returns the row, or
   * null when the Scope admits no such row. AC42: private-only surface
   * (`saveDraft`'s edit branch + `publishDraft`). */
  update(
    visibility: Private,
    id: string,
    patch: LegalDocumentPatch,
    scope: Scope<"legal_document", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomLegalDocumentSelect | null>;
  /** Scoped delete-by-id (draft discard) — fused via the gated handle. No
   * service/route reaches it yet; the gated surface stands ready — untouched
   * by AC42 threading. */
  delete(
    id: string,
    scope: Scope<"legal_document", "delete">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<void>;
}

export interface DrizzleLegalDocumentRepositoryDeps {
  db: NodePgDatabase<Record<string, unknown>>;
  createId: () => string;
}

const scopeWhere = (orgTypeId: string | null) =>
  orgTypeId === null
    ? isNull(uomLegalDocument.orgTypeId)
    : eq(uomLegalDocument.orgTypeId, orgTypeId);

export class DrizzleLegalDocumentRepository
  implements LegalDocumentRepository
{
  constructor(private readonly deps: DrizzleLegalDocumentRepositoryDeps) {}

  // Raw PUBLIC branch (AC22): the published-document lookup runs before any
  // session exists (consent flows, pre-session reads), so it never touches the
  // engine. The service filters to published; the draft-visible read is
  // `findByIdsScoped`.
  async findByIds(
    visibility: Public,
    ids: string[],
  ): Promise<UomLegalDocumentSelect[]> {
    void visibility; // leaf
    if (ids.length === 0) return [];
    return this.deps.db
      .select()
      .from(uomLegalDocument)
      .where(inArray(uomLegalDocument.id, ids));
  }

  async findByIdsScoped(
    visibility: Private,
    ids: string[],
    scope: Scope<"legal_document", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomLegalDocumentSelect[]> {
    void visibility; // leaf
    if (ids.length === 0) return [];
    // The read Scope is the access boundary; narrow it (AND) to the requested
    // ids (AC12 — narrow-only). A denied caller's Scope admits no row.
    const rows = await gateDb
      .read("legal_document", scope)
      .where(inArray(uomLegalDocument.id, ids))
      .rows();
    return rows as UomLegalDocumentSelect[];
  }

  // Raw PUBLIC branch (AC22): the latest-published lookup for consent screens
  // and pre-session reads — the engine gates only the draft/admin branch.
  async findLatestVersion(
    visibility: Public,
    type: LegalConsentType,
    orgTypeId: string | null,
  ): Promise<UomLegalDocumentSelect | null> {
    void visibility; // leaf
    const [doc] = await this.deps.db
      .select()
      .from(uomLegalDocument)
      .where(
        and(
          eq(uomLegalDocument.type, type),
          scopeWhere(orgTypeId),
          isNotNull(uomLegalDocument.publishedAt),
        ),
      )
      .orderBy(desc(uomLegalDocument.version))
      .limit(1);
    return doc ?? null;
  }

  async findDraft(
    visibility: Private,
    type: LegalConsentType,
    orgTypeId: string | null,
  ): Promise<UomLegalDocumentSelect | null> {
    void visibility; // leaf
    const [doc] = await this.deps.db
      .select()
      .from(uomLegalDocument)
      .where(
        and(
          eq(uomLegalDocument.type, type),
          scopeWhere(orgTypeId),
          isNull(uomLegalDocument.publishedAt),
        ),
      )
      .limit(1);
    return doc ?? null;
  }

  async findAllByScope(
    visibility: Private,
    type: LegalConsentType,
    orgTypeId: string | null,
    scope: Scope<"legal_document", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomLegalDocumentSelect[]> {
    void visibility; // leaf
    // The engine's read Scope decides which documents are visible; the display
    // query composes the (type, scope) filter + version ordering over the
    // admitted ids (AC7). A denied caller admits no ids ⇒ empty list (never a
    // fall-back to the published versions).
    const admitted = (await gateDb.read("legal_document", scope).rows()) as {
      id: string;
    }[];
    const admittedIds = admitted.map((r) => r.id);
    if (admittedIds.length === 0) return [];
    return this.deps.db
      .select()
      .from(uomLegalDocument)
      .where(
        and(
          inArray(uomLegalDocument.id, admittedIds),
          eq(uomLegalDocument.type, type),
          scopeWhere(orgTypeId),
        ),
      )
      .orderBy(desc(uomLegalDocument.version));
  }

  async create(
    visibility: Private,
    input: SaveDraftRecord,
  ): Promise<UomLegalDocumentSelect> {
    void visibility; // leaf
    const [latest] = await this.deps.db
      .select()
      .from(uomLegalDocument)
      .where(
        and(eq(uomLegalDocument.type, input.type), scopeWhere(input.orgTypeId)),
      )
      .orderBy(desc(uomLegalDocument.version))
      .limit(1);

    const row = {
      id: this.deps.createId(),
      type: input.type,
      orgTypeId: input.orgTypeId,
      version: (latest?.version ?? 0) + 1,
      title: input.title,
      contentHtml: input.contentHtml,
      publishedAt: null,
      createdAt: new Date(),
    };
    await this.deps.db.insert(uomLegalDocument).values(row);
    return row as UomLegalDocumentSelect;
  }

  async update(
    visibility: Private,
    id: string,
    patch: LegalDocumentPatch,
    scope: Scope<"legal_document", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomLegalDocumentSelect | null> {
    void visibility; // leaf
    // The gated handle fuses the update Scope into the write: the row is touched
    // (save-draft edit or the publish transition) only when the Scope admits it.
    // Denied / no such row ⇒ null (the service decides — the gate never throws).
    const row = await gateDb.update("legal_document", scope, id, {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.contentHtml !== undefined
        ? { contentHtml: patch.contentHtml }
        : {}),
      ...(patch.publishedAt !== undefined
        ? { publishedAt: patch.publishedAt }
        : {}),
    });
    return (row as UomLegalDocumentSelect | null) ?? null;
  }

  async delete(
    id: string,
    scope: Scope<"legal_document", "delete">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<void> {
    // Hard delete (draft discard) fused with the delete Scope. Denied / no such
    // row ⇒ no write.
    await gateDb.delete("legal_document", scope, id);
  }
}
