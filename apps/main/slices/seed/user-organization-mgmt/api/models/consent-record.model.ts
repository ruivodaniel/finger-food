/**
 * Consent-record schema — the append-only record of a user consenting to a
 * specific legal document version.
 *
 * Its own entity (own repo + service, API4): a consent row is an immutable
 * audit fact, never updated. Document facts are denormalized onto the row so
 * consent history survives the document changing shape.
 */

import { pgEnum, pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { uomLegalDocument, uomLegalDocumentTypeEnum } from "./legal.model";
import { uomUser } from "./user.model";

export const CONSENT_CONTEXTS = ["registration", "gate"] as const;
export const uomConsentContextEnum = pgEnum(
  "consent_context",
  CONSENT_CONTEXTS,
);

export const uomConsentRecord = pgTable(
  "consent_record",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => uomUser.id, { onDelete: "cascade" }),
    legalDocumentId: text("legal_document_id")
      .notNull()
      .references(() => uomLegalDocument.id),
    // Denormalized document facts — consent history must survive document
    // lookups changing shape.
    legalDocumentType: uomLegalDocumentTypeEnum("legal_document_type").notNull(),
    legalDocumentVersion: integer("legal_document_version").notNull(),
    orgTypeId: text("org_type_id"),
    context: uomConsentContextEnum("context").notNull(),
    consentedAt: timestamp("consented_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("consent_record_user_type_idx").on(
      table.userId,
      table.legalDocumentType,
    ),
  ],
);
export type UomConsentRecordSelect = typeof uomConsentRecord.$inferSelect;
