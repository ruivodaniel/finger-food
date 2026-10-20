// =============================================================================
// legal-doc-paths tests — slug round-trips and href building.
// Pure deps, node env.
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  legalDocumentHref,
  legalSlugToType,
  legalTypeFromSearch,
  legalTypeToSlug,
} from "./legal-doc-paths";
import { LEGAL_CONSENT_TYPES } from "../../shared/auth-config/types";

describe("legal document paths", () => {
  it("round-trips every consent type through its slug", () => {
    for (const type of LEGAL_CONSENT_TYPES) {
      expect(legalSlugToType(legalTypeToSlug(type))).toBe(type);
    }
  });

  it("uses the sitemap slugs", () => {
    expect(legalTypeToSlug("termsAndConditions")).toBe("terms-and-conditions");
    expect(legalTypeToSlug("privacyPolicy")).toBe("privacy-policy");
  });

  it("resolves nothing for unknown slugs", () => {
    expect(legalSlugToType("not-a-document")).toBeUndefined();
    expect(legalSlugToType(undefined)).toBeUndefined();
  });

  it("builds hrefs with type, orgTypeId and docId as search params", () => {
    expect(legalDocumentHref("termsAndConditions")).toBe(
      "/legal-documents?type=termsAndConditions",
    );
    expect(legalDocumentHref("privacyPolicy", { docId: "doc_1" })).toBe(
      "/legal-documents?type=privacyPolicy&docId=doc_1",
    );
    expect(
      legalDocumentHref("termsAndConditions", { orgTypeId: "company" }),
    ).toBe("/legal-documents?type=termsAndConditions&orgTypeId=company");
  });

  it("reads ?type as a type or a slug, defaulting to terms", () => {
    expect(legalTypeFromSearch("privacyPolicy")).toBe("privacyPolicy");
    expect(legalTypeFromSearch("privacy-policy")).toBe("privacyPolicy");
    expect(legalTypeFromSearch(undefined)).toBe("termsAndConditions");
    expect(legalTypeFromSearch("")).toBe("termsAndConditions");
    // an unmapped type passes through — the server answers it (404 → empty)
    expect(legalTypeFromSearch("cookiePolicy")).toBe("cookiePolicy");
  });
});
