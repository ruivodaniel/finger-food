// =============================================================================
// Legal service tests — draft/publish lifecycle, current-doc pairing,
// mandatory enforcement, consent staleness, sanitization, and the authoring
// catalog derivation.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { PRIVATE, PUBLIC } from "@libs/gated-scoped-ac";
import { LegalDocumentService } from "./legal-document.service";
import {
  InMemoryLegalDocumentRepository,
  testAc,
  testEngine,
  testErrors,
  testLogger,
} from "../testing/in-memory-repos";

// Authoring calls travel a scoped-AC context; the permissive testEngine allows
// every verdict/scope, so business logic (draft/publish, versioning) is what's
// exercised. Deny-by-default is proven against a real db (spec step 8).
const AUTHOR = testAc("author", { id: "platform_org", type: "platform_admin" });
import { fixtureAuthConfig } from "../../shared/auth-config/__fixtures__/auth.fixture.config";
import type {
  LegalConsentItem,
  OrgLifecycleEntry,
} from "../../shared/auth-config/types";

const items: LegalConsentItem[] = [
  { type: "termsAndConditions", shown: true, consent: true, mandatory: true },
  { type: "privacyPolicy", shown: true, consent: true, mandatory: true },
  { type: "marketing", shown: true, consent: true, mandatory: false },
];

const ORG_CONFIG: OrgLifecycleEntry[] = [
  {
    orgType: "company",
    label: "Company",
    isSingleInstance: false,
    creation: {
      actor: "user",
      ownership: {
        mode: ["creator"],
        membershipOwnerRole: "company_owner",
        legalConsent: [
          { type: "termsAndConditions", shown: true, consent: true },
        ],
      },
    },
    join: {
      invitation: {
        allow: true,
        strictEmailMatch: false,
        strictPhoneMatch: false,
      },
      spontaneous: { allow: false },
      legalConsent: [{ type: "privacyPolicy", shown: true, consent: true }],
    },
  },
  {
    orgType: "vault",
    label: "Vault",
    isSingleInstance: true,
    creation: { actor: "developer" },
  },
];

describe("legal-document service", () => {
  let repo: InMemoryLegalDocumentRepository;
  let service: LegalDocumentService;

  /** save + publish in one step — the seed-script convenience the service no
   * longer carries (API15: no production consumer). */
  const publishDoc = async (input: Parameters<LegalDocumentService["saveDraft"]>[2]) => {
    const draft = await service.saveDraft(AUTHOR, PRIVATE, input);
    return service.publishDraft(AUTHOR, PRIVATE, draft.id);
  };

  beforeEach(() => {
    repo = new InMemoryLegalDocumentRepository();
    service = new LegalDocumentService({
      legalDocumentRepo: repo,
      engine: testEngine,
      authConfig: fixtureAuthConfig,
      orgConfig: ORG_CONFIG,
      errors: testErrors,
      logger: testLogger,
    });
  });

  it("publishing increments versions per (type, scope)", async () => {
    const v1 = await publishDoc({
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>1</p>",
    });
    const v2 = await publishDoc({
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>2</p>",
    });
    expect(v1.version).toBe(1);
    expect(v2.version).toBe(2);
    const current = await service.getLatestVersion(PUBLIC, "termsAndConditions", null);
    expect(current?.version).toBe(2);
  });

  it("saveDraft opens the next version; current stays the published one", async () => {
    await publishDoc({
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>v1</p>",
    });
    const draft = await service.saveDraft(AUTHOR, PRIVATE, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T next",
      contentHtml: "<p>v2 wip</p>",
    });
    expect(draft.version).toBe(2);
    expect(draft.publishedAt).toBeNull();
    const current = await service.getLatestVersion(PUBLIC, "termsAndConditions", null);
    expect(current?.version).toBe(1);
  });

  it("saveDraft edits an existing draft in place", async () => {
    const first = await service.saveDraft(AUTHOR, PRIVATE, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "A",
      contentHtml: "<p>a</p>",
    });
    const second = await service.saveDraft(AUTHOR, PRIVATE, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "B",
      contentHtml: "<p>b</p>",
    });
    expect(second.id).toBe(first.id);
    expect(second.version).toBe(1);
    expect((await service.getVersions(AUTHOR, PRIVATE, "termsAndConditions", null))).toHaveLength(1);
  });

  it("publishDraft advances current; re-publish is a 400", async () => {
    const draft = await service.saveDraft(AUTHOR, PRIVATE, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>t</p>",
    });
    expect(await service.getLatestVersion(PUBLIC, "termsAndConditions", null)).toBeNull();
    const published = await service.publishDraft(AUTHOR, PRIVATE, draft.id);
    expect(published.publishedAt).not.toBeNull();
    const current = await service.getLatestVersion(PUBLIC, "termsAndConditions", null);
    expect(current?.id).toBe(draft.id);
    await expect(service.publishDraft(AUTHOR, PRIVATE, draft.id)).rejects.toThrow(/already published/);
  });

  it("getDocumentById hides drafts unless includeDraft", async () => {
    const draft = await service.saveDraft(AUTHOR, PRIVATE, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>t</p>",
    });
    await expect(service.getDocumentById(PUBLIC, draft.id)).rejects.toThrow(/not found/);
    const seen = await service.getDocumentByIdForAuthor(AUTHOR, PRIVATE, draft.id);
    expect(seen.id).toBe(draft.id);
  });

  it("saveDraft sanitizes HTML to the allowlist", async () => {
    const draft = await service.saveDraft(AUTHOR, PRIVATE, {
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml:
        '<p onclick="x()">ok</p><script>evil()</script><a href="javascript:evil()">l</a>',
    });
    expect(draft.contentHtml).not.toContain("script");
    expect(draft.contentHtml).not.toContain("onclick");
    expect(draft.contentHtml).not.toContain("javascript:");
    expect(draft.contentHtml).toContain("<p>ok</p>");
  });

  it("itemsWithDocuments pairs items with current docs; unpublished → null + waived", async () => {
    await publishDoc({
      type: "termsAndConditions",
      orgTypeId: null,
      title: "T",
      contentHtml: "<p>t</p>",
    });
    const paired = await service.itemsWithDocuments(PUBLIC, items, null);
    expect(paired).toHaveLength(3);
    expect(paired.find((p) => p.type === "termsAndConditions")?.document).not.toBeNull();
    expect(paired.find((p) => p.type === "privacyPolicy")?.document).toBeNull();
    expect(paired.find((p) => p.type === "marketing")?.mandatory).toBe(false);
  });

  it("itemsWithDocuments skips shown:false and flags informational items", async () => {
    const paired = await service.itemsWithDocuments(
      PUBLIC,
      [
        { type: "termsAndConditions", shown: false },
        { type: "privacyPolicy", shown: true, consent: false },
      ],
      null,
    );
    expect(paired).toHaveLength(1);
    expect(paired[0]).toMatchObject({
      type: "privacyPolicy",
      consent: false,
      mandatory: false,
    });
  });

  it("authoringCatalog derives platform + org-type scopes from the configs", async () => {
    const catalog = service.authoringCatalog(AUTHOR, PRIVATE);
    const platform = catalog.find((s) => s.orgTypeId === null);
    expect(platform?.label).toBe("Platform");
    expect(platform?.types).toContain("termsAndConditions");

    const company = catalog.find((s) => s.orgTypeId === "company");
    expect(company?.label).toBe("Company");
    // creation consent + join consent are unioned
    expect(company?.types).toEqual(
      expect.arrayContaining(["termsAndConditions", "privacyPolicy"]),
    );

    // an org type whose configs reference no consent gets no group
    expect(catalog.find((s) => s.orgTypeId === "vault")).toBeUndefined();
  });
});
