/**
 * Legal-document service — authoring (draft → publish) and the projections
 * consent screens render. Owns `legal_document`; consent rows are the
 * consent-record service's business (API12).
 *
 * Draft mechanics: the scope's draft is its highest-version row with
 * `publishedAt = null`. "Latest" always means latest PUBLISHED (API30/UOM16 —
 * there is no rollback, so nothing is ever "current" in a mutable sense).
 */

import type { Ac, Private, Public, ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type {
  AuthAndRegistrationConfig,
  LegalConsentItem,
  LegalConsentType,
  OrgLifecycleEntry,
} from "../../shared/auth-config/types";
import { matches } from "../../shared/auth-config/resolver";
import type {
  ConsentItemDocumentView,
  LegalDocumentView,
} from "../../shared/types/domain";
import type { LegalDocumentRepository } from "../repositories/legal-document.repository";
import type { UomLegalDocumentSelect } from "../models/legal.model";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import { sanitizeLegalHtml } from "../shared/sanitize-legal-html";

export interface SaveDraftInput {
  type: LegalConsentType;
  orgTypeId: string | null;
  title: string;
  contentHtml: string;
}

export interface AuthoringScope {
  orgTypeId: string | null;
  label: string;
  types: LegalConsentType[];
}

export interface LegalDocumentServiceDeps {
  legalDocumentRepo: LegalDocumentRepository;
  /** The config-bound engine (AC37: injected, never constructed here). Mints the
   * authoring read/update Scopes the repo executes and the create/update verdicts.
   * The PUBLIC published-document reads never touch it (AC22). */
  engine: Pick<
    Ac,
    "resolveRead" | "resolveUpdate" | "allowCreate" | "allowUpdate"
  >;
  authConfig: AuthAndRegistrationConfig;
  orgConfig: OrgLifecycleEntry[];
  errors: ModuleErrors;
  logger: ModuleLogger;
}

export function isMandatory(item: LegalConsentItem): boolean {
  return item.shown && item.consent === true && item.mandatory !== false;
}

export class LegalDocumentService {
  constructor(private readonly deps: LegalDocumentServiceDeps) {}

  /** The projection consent screens render: shown items + latest docs. AC42:
   * Public — reached by the public invitation capability view
   * (`invitationService.getPublicView`) as well as the private gate
   * (`pendingConsents`); Public is the loosest demand covering both. */
  async itemsWithDocuments(
    visibility: Public,
    items: LegalConsentItem[],
    orgTypeId: string | null,
  ): Promise<ConsentItemDocumentView[]> {
    const out: ConsentItemDocumentView[] = [];
    for (const item of items) {
      if (!item.shown) continue;
      const doc = await this.deps.legalDocumentRepo.findLatestVersion(
        visibility,
        item.type,
        orgTypeId,
      );
      if (!doc) {
        this.deps.logger.warn(
          "no published legal document for consent item — waived",
          { type: item.type, orgTypeId },
        );
      }
      out.push({
        type: item.type,
        consent: item.consent === true,
        mandatory: isMandatory(item),
        document: doc
          ? { id: doc.id, title: doc.title, version: doc.version }
          : null,
      });
    }
    return out;
  }

  /** The scope's latest published row, or null — the consent service's source
   * of truth for "which version must be consented to". AC42: Public — reached
   * directly by the public `getLatestVersion` route and by the token-less
   * consent internals (`recordConsentScoped`/`consentSatisfied`, which pass `PUBLIC`
   * literally per rule 5 — this data is world-readable regardless of caller). */
  async latestPublished(
    visibility: Public,
    type: LegalConsentType,
    orgTypeId: string | null,
  ): Promise<UomLegalDocumentSelect | null> {
    return this.deps.legalDocumentRepo.findLatestVersion(
      visibility,
      type,
      orgTypeId,
    );
  }

  async getLatestVersion(
    visibility: Public,
    type: LegalConsentType,
    orgTypeId: string | null,
  ): Promise<LegalDocumentView | null> {
    const doc = await this.latestPublished(visibility, type, orgTypeId);
    return doc ? toView(doc) : null;
  }

  /** Upsert the scope's draft: edit in place, or open the next version.
   * Authoring (`manage_legal_document_platform`) — the engine gates each branch:
   * an edit runs the update column-verdict (AC10) then the scoped write, a new
   * version runs the context-only create verdict (AC9/AC33). Denied ⇒ forbidden. */
  async saveDraft(
    ac: ScopedAcRequestContext,
    visibility: Private,
    input: SaveDraftInput,
  ): Promise<LegalDocumentView> {
    const contentHtml = sanitizeLegalHtml(input.contentHtml);
    // Decides edit-vs-create through the caller's read Scope: a denied caller
    // sees no draft, falls to the create branch, and is forbidden there.
    const existing = await this.deps.legalDocumentRepo.findDraftScoped(
      visibility,
      input.type,
      input.orgTypeId,
      this.deps.engine.resolveRead(ac.permissions, "legal_document", ac.bag),
      ac.gateDb,
    );
    if (existing) {
      const patch = { title: input.title, contentHtml };
      const verdict = this.deps.engine.allowUpdate(
        ac.permissions,
        "legal_document",
        patch,
        ac.bag,
      );
      if (!verdict.allow) {
        throw this.deps.errors.forbidden(
          verdict.reason ?? "cannot edit legal document",
        );
      }
      const scope = this.deps.engine.resolveUpdate(
        ac.permissions,
        "legal_document",
        ac.bag,
      );
      const updated = await this.deps.legalDocumentRepo.update(
        visibility,
        existing.id,
        patch,
        scope,
        ac.gateDb,
      );
      // null ⇒ the Scope admitted no such row (denied, AC6/AC9).
      if (!updated) {
        throw this.deps.errors.forbidden("cannot edit legal document");
      }
      return toView(updated);
    }
    // New version: context-only create verdict (AC9/AC33) as the cheap early
    // refusal, then the insert through the gate, which takes it again.
    const verdict = this.deps.engine.allowCreate(
      ac.permissions,
      "legal_document",
      ac.bag,
    );
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(
        verdict.reason ?? "cannot create legal document",
      );
    }
    const created = await this.deps.legalDocumentRepo.create(
      visibility,
      {
        type: input.type,
        orgTypeId: input.orgTypeId,
        title: input.title,
        contentHtml,
      },
      ac.permissions,
      this.deps.engine.resolveRead(ac.permissions, "legal_document", ac.bag),
      ac.gateDb,
    );
    // null ⇒ the gate refused the insert.
    if (!created) {
      throw this.deps.errors.forbidden("cannot create legal document");
    }
    return toView(created);
  }

  /** Stamp a draft published — consent-bound callers re-consent from here on.
   * The publish transition is a gated write (`manage_legal_document_platform`):
   * column verdict (AC10) then the scoped update; denied ⇒ forbidden. */
  async publishDraft(
    ac: ScopedAcRequestContext,
    visibility: Private,
    id: string,
  ): Promise<LegalDocumentView> {
    // Raw load for the business-rule check (exists, not already published); the
    // publish WRITE below is the gate (a denied caller is forbidden, never
    // publishes), so the load can stay raw — it never returns to a denied caller.
    const doc =
      (await this.deps.legalDocumentRepo.findByIds(visibility, [id]))[0] ??
      null;
    if (!doc) throw this.deps.errors.notFound("document not found");
    if (doc.publishedAt) {
      throw this.deps.errors.badRequest("document is already published");
    }
    const publishedAt = new Date();
    const verdict = this.deps.engine.allowUpdate(
      ac.permissions,
      "legal_document",
      { publishedAt },
      ac.bag,
    );
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(
        verdict.reason ?? "cannot publish legal document",
      );
    }
    const scope = this.deps.engine.resolveUpdate(
      ac.permissions,
      "legal_document",
      ac.bag,
    );
    const updated = await this.deps.legalDocumentRepo.update(
      visibility,
      id,
      { publishedAt },
      scope,
      ac.gateDb,
    );
    if (!updated) {
      throw this.deps.errors.forbidden("cannot publish legal document");
    }
    return toView(updated);
  }

  /** The scope's versions, newest first: the published ones for every caller
   * (world-readable, AC22 — the same data the consent screens serve), plus the
   * draft when the caller's grants admit it (an author). The published history
   * is the raw PUBLIC read; the draft is the read pass-through (AC5): the
   * engine resolves the read Scope, the repo executes it. */
  async getVersions(
    ac: ScopedAcRequestContext,
    visibility: Private,
    type: LegalConsentType,
    orgTypeId: string | null,
  ): Promise<LegalDocumentView[]> {
    const scope = this.deps.engine.resolveRead(
      ac.permissions,
      "legal_document",
      ac.bag,
    );
    const [published, draft] = await Promise.all([
      this.deps.legalDocumentRepo.findPublishedByScope(visibility, type, orgTypeId),
      this.deps.legalDocumentRepo.findDraftScoped(
        visibility,
        type,
        orgTypeId,
        scope,
        ac.gateDb,
      ),
    ]);
    // The draft is the scope's highest version by construction, so it heads
    // the list.
    return [...(draft ? [draft] : []), ...published].map(toView);
  }

  /** One PUBLISHED version by id — the PUBLIC `/legal/documents/:id` branch
   * (AC22: published legal documents are world-readable, served before any
   * session exists). Drafts 404. Raw: no bag on this path, so it never runs the
   * engine; the draft-visible authoring read is `getDocumentByIdForAuthor`. */
  async getDocumentById(
    visibility: Public,
    id: string,
  ): Promise<LegalDocumentView> {
    const doc =
      (await this.deps.legalDocumentRepo.findByIds(visibility, [id]))[0] ??
      null;
    if (!doc || !doc.publishedAt) {
      throw this.deps.errors.notFound("document not found");
    }
    return toView(doc);
  }

  /** One version by id, draft included — the gated `/legal-admin/documents/:id`
   * authoring branch. Read pass-through (AC5): the engine's read Scope admits the
   * row; a denied caller resolves no row ⇒ 404 (existence + access fused, never a
   * silent fall-back to the published version). */
  async getDocumentByIdForAuthor(
    ac: ScopedAcRequestContext,
    visibility: Private,
    id: string,
  ): Promise<LegalDocumentView> {
    const scope = this.deps.engine.resolveRead(
      ac.permissions,
      "legal_document",
      ac.bag,
    );
    const doc =
      (await this.deps.legalDocumentRepo.findByIdsScoped(
        visibility,
        [id],
        scope,
        ac.gateDb,
      ))[0] ?? null;
    if (!doc) throw this.deps.errors.notFound("document not found");
    return toView(doc);
  }

  /**
   * The (scope, type) pairs the configs reference — what the authoring UI
   * offers. Platform = registration rules; per org type = membership rules
   * ∪ creation/join consent blocks.
   *
   * Ungated: it reads config, not rows, so every signed-in caller gets the
   * same menu. What a caller sees or changes inside it is the engine's call
   * on the rows — the versions read and the draft/publish writes.
   */
  authoringCatalog(visibility: Private): AuthoringScope[] {
    void visibility; // no downstream repo/service call to thread into
    const out: AuthoringScope[] = [];

    const platformTypes = this.consentTypesFor({ intent: "registration" });
    if (platformTypes.length > 0) {
      out.push({ orgTypeId: null, label: "Platform", types: platformTypes });
    }

    for (const entry of this.deps.orgConfig) {
      const types = new Set<LegalConsentType>([
        ...this.consentTypesFor({ membershipOrgType: entry.orgType }),
        ...shownTypes(entry.creation.ownership?.legalConsent),
        ...shownTypes(entry.join?.legalConsent),
      ]);
      if (types.size > 0) {
        out.push({
          orgTypeId: entry.orgType,
          label: entry.label,
          types: [...types],
        });
      }
    }
    return out;
  }

  private consentTypesFor(ctx: {
    intent?: "registration";
    membershipOrgType?: string;
  }): LegalConsentType[] {
    const types = new Set<LegalConsentType>();
    for (const rule of this.deps.authConfig.legalConsent) {
      if (!matches(rule.condition, ctx)) continue;
      for (const type of shownTypes(rule.outcome.consent)) types.add(type);
    }
    return [...types];
  }
}

function shownTypes(items: LegalConsentItem[] | undefined): LegalConsentType[] {
  return (items ?? []).filter((i) => i.shown).map((i) => i.type);
}

export function toView(doc: UomLegalDocumentSelect): LegalDocumentView {
  return {
    id: doc.id,
    type: doc.type,
    orgTypeId: doc.orgTypeId,
    version: doc.version,
    title: doc.title,
    contentHtml: doc.contentHtml,
    publishedAt: doc.publishedAt?.toISOString() ?? null,
  };
}
