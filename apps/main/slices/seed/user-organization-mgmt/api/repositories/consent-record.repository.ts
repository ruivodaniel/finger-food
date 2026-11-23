/**
 * Consent-record repository — data access for `consent_record`.
 *
 * A consent row is an immutable audit fact: who consented, to which document
 * version, in what context. Never updated — a new consent is a new row.
 */

import { inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { GatedDb, SchemaTables } from "@libs/gated-scoped-ac";
import {
  uomConsentRecord,
  type UomConsentRecordSelect,
  type CONSENT_CONTEXTS,
} from "../models/consent-record.model";
import type { UomLegalDocumentSelect } from "../models/legal.model";

export type ConsentContext = (typeof CONSENT_CONTEXTS)[number];

export interface CreateConsentRecord {
  userId: string;
  document: UomLegalDocumentSelect;
  context: ConsentContext;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentRecordRepository {
  /** Gated insert — the gate takes the `record_own_consent` verdict on the row
   * (its payload: the row is the caller's own); null when denied. */
  create(
    input: CreateConsentRecord,
    permissions: Iterable<string>,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomConsentRecordSelect | null>;
  /** Every consent the users have given — plural, id-filtered (API6). */
  findAllByUserIds(userIds: string[]): Promise<UomConsentRecordSelect[]>;
}

export interface DrizzleConsentRecordRepositoryDeps {
  db: NodePgDatabase<Record<string, unknown>>;
  createId: () => string;
}

// AC42: token-less. Both methods are reached exclusively through the module's
// token-less infrastructure paths (`recordConsentScoped`'s recorder, the gate
// evaluator's `consentSatisfied`) — rule 5, no route mints a token for either,
// so neither gains a `visibility` parameter.
export class DrizzleConsentRecordRepository
  implements ConsentRecordRepository
{
  constructor(private readonly deps: DrizzleConsentRecordRepositoryDeps) {}

  async create(
    input: CreateConsentRecord,
    permissions: Iterable<string>,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomConsentRecordSelect | null> {
    // The gate runs the verdict (the row's userId must be the caller's) and
    // inserts; null ⇒ refused, and the service decides what that means.
    const inserted = await gateDb.create("consent_record", permissions, {
      id: this.deps.createId(),
      userId: input.userId,
      legalDocumentId: input.document.id,
      legalDocumentType: input.document.type,
      legalDocumentVersion: input.document.version,
      orgTypeId: input.document.orgTypeId,
      context: input.context,
      consentedAt: new Date(),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    return (inserted as UomConsentRecordSelect | null) ?? null;
  }

  // Raw infrastructure read (AC39): the sole caller is the gate obligation
  // evaluator (consentSatisfied), which always passes the caller's OWN id to
  // decide whether to 428-block them — plumbing that runs in middleware, like
  // bag hydration, and carries no per-request Scope. A `view_own_consent`
  // self-read would admit exactly the same rows, so gating changes nothing here.
  // A genuine CROSS-USER audit read (an admin reading another user's history)
  // awaits its own permission and a gated surface (AC35) — none exists yet.
  async findAllByUserIds(userIds: string[]): Promise<UomConsentRecordSelect[]> {
    if (userIds.length === 0) return [];
    return this.deps.db
      .select()
      .from(uomConsentRecord)
      .where(inArray(uomConsentRecord.userId, userIds));
  }
}
