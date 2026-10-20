// =============================================================================
// Consent-record service tests — recording consent and staleness checks
// against the latest published document. Docker-free.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { PRIVATE } from "@libs/gated-scoped-ac";
import { LegalDocumentService } from "./legal-document.service";
import { ConsentRecordService } from "./consent-record.service";
import {
  InMemoryConsentRecordRepository,
  InMemoryLegalDocumentRepository,
  testAc,
  testEngine,
  testErrors,
  testLogger,
} from "../testing/in-memory-repos";

// Authoring the fixtures travels a scoped-AC context; testEngine allows every
// verdict/scope so business logic (mandatory enforcement, staleness) is tested.
const AUTHOR = testAc("author", { id: "platform_org", type: "platform_admin" });
import { fixtureAuthConfig } from "../../shared/auth-config/__fixtures__/auth.fixture.config";
import type { LegalConsentItem } from "../../shared/auth-config/types";

const items: LegalConsentItem[] = [
  { type: "termsAndConditions", shown: true, consent: true, mandatory: true },
  { type: "privacyPolicy", shown: true, consent: true, mandatory: true },
  { type: "marketing", shown: true, consent: true, mandatory: false },
];

describe("consent-record service", () => {
  let repo: InMemoryLegalDocumentRepository;
  let consentRepo: InMemoryConsentRecordRepository;
  let documents: LegalDocumentService;
  let service: ConsentRecordService;

  const publishDoc = async (input: Parameters<LegalDocumentService["saveDraft"]>[2]) => {
    const draft = await documents.saveDraft(AUTHOR, PRIVATE, input);
    return documents.publishDraft(AUTHOR, PRIVATE, draft.id);
  };

  beforeEach(() => {
    repo = new InMemoryLegalDocumentRepository();
    consentRepo = new InMemoryConsentRecordRepository();
    documents = new LegalDocumentService({
      legalDocumentRepo: repo,
      engine: testEngine,
      authConfig: fixtureAuthConfig,
      orgConfig: [],
      errors: testErrors,
      logger: testLogger,
    });
    service = new ConsentRecordService({
      consentRecordRepo: consentRepo,
      legalDocumentService: documents,
      engine: testEngine,
      errors: testErrors,
    });
  });

  it("recordConsent enforces mandatory acceptance only for published docs", async () => {
    await publishDoc({
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>t</p>",
    });
    // privacy is mandatory but unpublished → waived; rejecting terms fails
    await expect(
      service.recordConsent({
        userId: "u1",
        items,
        decisions: [{ type: "termsAndConditions", accepted: false }],
        orgTypeId: null,
        context: "registration",
      }),
    ).rejects.toThrow(/termsAndConditions/);

    await service.recordConsent({
      userId: "u1",
      items,
      decisions: [
        { type: "termsAndConditions", accepted: true },
        { type: "marketing", accepted: true },
      ],
      orgTypeId: null,
      context: "registration",
    });
    const records = await consentRepo.findAllByUserIds(["u1"]);
    // marketing accepted but unpublished → only terms recorded
    expect(records.map((r) => r.legalDocumentType)).toEqual([
      "termsAndConditions",
    ]);
  });

  it("consentSatisfied tracks the CURRENT version", async () => {
    await publishDoc({
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>t</p>",
    });
    const mandatoryOnly = items.slice(0, 1);
    expect(await service.consentSatisfied("u1", mandatoryOnly, null)).toBe(false);
    await service.recordConsent({
      userId: "u1",
      items: mandatoryOnly,
      decisions: [{ type: "termsAndConditions", accepted: true }],
      orgTypeId: null,
      context: "registration",
    });
    expect(await service.consentSatisfied("u1", mandatoryOnly, null)).toBe(true);
    // re-publish → stale
    await publishDoc({
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T2",
      contentHtml: "<p>t2</p>",
    });
    expect(await service.consentSatisfied("u1", mandatoryOnly, null)).toBe(false);
  });

  it("a pending draft does not affect consentSatisfied until published", async () => {
    await publishDoc({
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>t</p>",
    });
    const mandatoryOnly = items.slice(0, 1);
    await service.recordConsent({
      userId: "u1",
      items: mandatoryOnly,
      decisions: [{ type: "termsAndConditions", accepted: true }],
      orgTypeId: null,
      context: "registration",
    });
    const draft = await documents.saveDraft(AUTHOR, PRIVATE, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T2",
      contentHtml: "<p>t2</p>",
    });
    expect(await service.consentSatisfied("u1", mandatoryOnly, null)).toBe(true);
    await documents.publishDraft(AUTHOR, PRIVATE, draft.id);
    expect(await service.consentSatisfied("u1", mandatoryOnly, null)).toBe(false);
  });

  it("listForUser returns only the caller's records, newest first", async () => {
    const row = (
      id: string,
      userId: string,
      consentedAt: Date,
    ): (typeof consentRepo.consents)[number] => ({
      id,
      userId,
      legalDocumentId: `doc_${id}`,
      legalDocumentType: "termsAndConditions",
      legalDocumentVersion: 1,
      orgTypeId: null,
      context: "registration",
      consentedAt,
      ipAddress: null,
      userAgent: null,
    });
    consentRepo.consents.push(
      row("a", "u1", new Date("2026-01-01")),
      row("b", "u2", new Date("2026-02-01")),
      row("c", "u1", new Date("2026-03-01")),
    );

    const history = await service.listForUser("u1");
    expect(history.map((r) => r.id)).toEqual(["c", "a"]);
  });
});
