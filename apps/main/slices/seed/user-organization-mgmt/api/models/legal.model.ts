/**
 * Legal-document schema — versioned legal documents.
 *
 * Consent records are their own entity — see `consent-record.model.ts`.
 *
 * A document lives as a chain of versioned rows per (type, orgTypeId) scope:
 * a row with `publishedAt = null` is the scope's single editable DRAFT; a
 * published row is immutable, and editing after publish opens the next
 * version. New rows take `version = max(scope) + 1`, so the draft always
 * holds the top version number and the unique index guarantees at most one
 * per scope. "Current" = the highest PUBLISHED version for the scope.
 *
 * `orgTypeId` is null for platform-scoped documents; an org type's documents
 * carry its id.
 */

import { pgEnum, pgTable, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { LEGAL_CONSENT_TYPES } from "../../shared/auth-config/types";

export const uomLegalDocumentTypeEnum = pgEnum(
  "legal_document_type",
  LEGAL_CONSENT_TYPES,
);

export const uomLegalDocument = pgTable(
  "legal_document",
  {
    id: text("id").primaryKey(),
    type: uomLegalDocumentTypeEnum("type").notNull(),
    /** Null = platform-scoped. Org-type-scoped documents come with org types. */
    orgTypeId: text("org_type_id"),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    /** Sanitized HTML — the document's single source of record. */
    contentHtml: text("content_html").notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("legal_document_type_scope_version_idx").on(
      table.type,
      table.orgTypeId,
      table.version,
    ),
  ],
);
export type UomLegalDocumentSelect = typeof uomLegalDocument.$inferSelect;
