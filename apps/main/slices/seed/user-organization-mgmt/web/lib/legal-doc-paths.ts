/**
 * Legal-document URL vocabulary — the baseline sitemap serves the public
 * viewer at /legal-documents, the document named by search params: ?type
 * (the document type; absent = terms and conditions), ?orgTypeId (narrows
 * to an org type's document) and ?docId (pins one immutable version and wins
 * over the current-published lookup). Producers build hrefs ONLY through
 * legalDocumentHref so the shape lives in one place.
 *
 * Slugs name document types in the authoring URLs
 * (/manage-legal-documents/<slug>/<orgTypeKey>); the viewer accepts one in
 * ?type too. Document types travel as plain strings in the domain views, so
 * the helpers accept strings: an unmapped type falls back to itself as the
 * slug (deterministic, still routable), and an unknown slug resolves to
 * nothing.
 */

import {
  LEGAL_CONSENT_TYPES,
  type LegalConsentType,
} from "../../shared/auth-config/types";

export const LEGAL_DOCUMENTS_BASE_PATH = "/legal-documents";

const TYPE_TO_SLUG: Record<LegalConsentType, string> = {
  termsAndConditions: "terms-and-conditions",
  privacyPolicy: "privacy-policy",
  marketing: "marketing",
};

const SLUG_TO_TYPE = Object.fromEntries(
  LEGAL_CONSENT_TYPES.map((type) => [TYPE_TO_SLUG[type], type]),
) as Record<string, LegalConsentType>;

export function legalTypeToSlug(type: string): string {
  return TYPE_TO_SLUG[type as LegalConsentType] ?? type;
}

/** Undefined for a slug that names no document type (bad URL). */
export function legalSlugToType(
  slug: string | undefined,
): LegalConsentType | undefined {
  return slug ? SLUG_TO_TYPE[slug] : undefined;
}

/** The document the bare viewer shows when no ?type is given. */
export const DEFAULT_LEGAL_DOCUMENT_TYPE: LegalConsentType = "termsAndConditions";

/** The viewer's ?type → a document type: a type as-is, a slug mapped. */
export function legalTypeFromSearch(value: unknown): string {
  if (typeof value !== "string" || value === "") return DEFAULT_LEGAL_DOCUMENT_TYPE;
  return legalSlugToType(value) ?? value;
}

export function legalDocumentHref(
  type: string,
  options?: { docId?: string; orgTypeId?: string },
): string {
  const params = new URLSearchParams({ type });
  if (options?.orgTypeId) params.set("orgTypeId", options.orgTypeId);
  if (options?.docId) params.set("docId", options.docId);
  return `${LEGAL_DOCUMENTS_BASE_PATH}?${params.toString()}`;
}
