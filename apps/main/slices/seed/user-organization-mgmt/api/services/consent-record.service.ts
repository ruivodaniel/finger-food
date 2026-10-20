/**
 * Consent-record service — validates consent decisions and records them
 * against the latest PUBLISHED document version.
 *
 * Owns `consent_record`. Documents belong to the legal-document service and
 * are reached through it, never through its repository (API12).
 *
 * Mandatory = shown + consent:true + not marked `mandatory: false`. An
 * unpublished document is waived (nothing to consent to yet).
 */

import { PUBLIC, type Ac, type Private } from "@libs/gated-scoped-ac";
import type { LegalConsentItem, LegalConsentType } from "../../shared/auth-config/types";
import type { ScopedAcRequestContext } from "../shared/scoped-ac";
import type { UomConsentRecordSelect } from "../models/consent-record.model";
import type {
  ConsentContext,
  ConsentRecordRepository,
} from "../repositories/consent-record.repository";
import type { ModuleErrors } from "../shared/module-errors";
import { isMandatory, type LegalDocumentService } from "./legal-document.service";

export interface ConsentDecision {
  type: LegalConsentType;
  accepted: boolean;
}

export interface ConsentRecordServiceDeps {
  consentRecordRepo: ConsentRecordRepository;
  legalDocumentService: Pick<LegalDocumentService, "latestPublished">;
  /** The config-bound engine (AC37: injected). Gates the one authenticated
   * consent-record create surface via `allowCreate`. */
  engine: Pick<Ac, "allowCreate">;
  errors: ModuleErrors;
}

export class ConsentRecordService {
  constructor(private readonly deps: ConsentRecordServiceDeps) {}

  /** Gated create — the authenticated `POST /legal/consent` surface. Context-only
   * verdict (AC9/AC33): consent rows are self-stamped (`userId` comes from the
   * session, never input), so the `record_own_consent` verdict only answers "may
   * this caller record a consent at all"; denied ⇒ forbidden. Delegates to the
   * raw recorder. */
  async recordConsentScoped(
    ac: ScopedAcRequestContext,
    visibility: Private,
    input: {
      userId: string;
      items: LegalConsentItem[];
      decisions: ConsentDecision[];
      orgTypeId: string | null;
      context: ConsentContext;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    void visibility; // the raw core it delegates to is token-less (rule 5)
    const verdict = this.deps.engine.allowCreate(
      ac.permissions,
      "consent_record",
      ac.bag,
    );
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(
        verdict.reason ?? "cannot record consent",
      );
    }
    await this.recordConsent(input);
  }

  /** Validate decisions (mandatory ⇒ accepted) and record accepted items.
   * Raw self-write core (AC33: `userId` is always the session/registering user's
   * own id, never caller-controlled): reached from the pre-session registration
   * seed (no bag) and from the already-authorized org-create / invitation-accept
   * orchestration. The direct authenticated route gates via `recordConsentScoped`. */
  async recordConsent(input: {
    userId: string;
    items: LegalConsentItem[];
    decisions: ConsentDecision[];
    orgTypeId: string | null;
    context: ConsentContext;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const decided = new Map(input.decisions.map((d) => [d.type, d.accepted]));
    for (const item of input.items) {
      if (!isMandatory(item)) continue;
      const doc = await this.deps.legalDocumentService.latestPublished(
        PUBLIC, // exempt raw path (rule 5) — this data is world-readable regardless
        item.type,
        input.orgTypeId,
      );
      if (!doc) continue; // unpublished ⇒ waived
      if (decided.get(item.type) !== true) {
        throw this.deps.errors.badRequest(
          `consent to "${item.type}" is required`,
        );
      }
    }
    for (const item of input.items) {
      if (!item.shown || decided.get(item.type) !== true) continue;
      const doc = await this.deps.legalDocumentService.latestPublished(
        PUBLIC, // exempt raw path (rule 5) — this data is world-readable regardless
        item.type,
        input.orgTypeId,
      );
      if (!doc) continue;
      await this.deps.consentRecordRepo.create({
        userId: input.userId,
        document: doc,
        context: input.context,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    }
  }

  /** The caller's OWN consent history, newest first. Raw self-read (AC33:
   * the `/legal/consent/history` surface always stamps the session user's own
   * id, never caller input) — same admission argument as `consentSatisfied`. */
  async listForUser(userId: string): Promise<UomConsentRecordSelect[]> {
    const records = await this.deps.consentRecordRepo.findAllByUserIds([
      userId,
    ]);
    return [...records].sort(
      (a, b) => b.consentedAt.getTime() - a.consentedAt.getTime(),
    );
  }

  /** Are all mandatory items consented at their latest published version?
   * Raw infrastructure (AC39): the sole caller is the gate obligation evaluator,
   * which passes the caller's OWN id — plumbing that runs in middleware to decide
   * 428-blocking, carrying no per-request Scope. A `view_own_consent` self-read
   * admits exactly these rows, so gating adds nothing; a cross-user audit read
   * awaits its own permission and gated surface (AC35). See the repository note. */
  async consentSatisfied(
    userId: string,
    items: LegalConsentItem[],
    orgTypeId: string | null,
  ): Promise<boolean> {
    const records = await this.deps.consentRecordRepo.findAllByUserIds([userId]);
    for (const item of items) {
      if (!isMandatory(item)) continue;
      const doc = await this.deps.legalDocumentService.latestPublished(
        PUBLIC, // exempt raw path (rule 5) — this data is world-readable regardless
        item.type,
        orgTypeId,
      );
      if (!doc) continue; // unpublished ⇒ waived
      const hasCurrent = records.some(
        (r) =>
          r.legalDocumentType === item.type &&
          r.legalDocumentVersion === doc.version &&
          (r.orgTypeId ?? null) === orgTypeId,
      );
      if (!hasCurrent) return false;
    }
    return true;
  }
}
