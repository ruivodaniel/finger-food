import { z } from "zod";
import { LEGAL_CONSENT_TYPES } from "../../shared/auth-config/types";

export const LegalConsentTypeSchema = z.enum(LEGAL_CONSENT_TYPES);

export const SaveLegalDocumentDraftSchema = z.object({
  type: LegalConsentTypeSchema,
  orgTypeId: z.string().min(1).nullable().default(null),
  title: z.string().min(1),
  contentHtml: z.string().min(1),
});
export type SaveLegalDocumentDraftInput = z.infer<
  typeof SaveLegalDocumentDraftSchema
>;

export const ConsentSubmissionSchema = z.object({
  consents: z
    .array(
      z.object({
        type: LegalConsentTypeSchema,
        accepted: z.boolean(),
      }),
    )
    .min(1),
});
export type ConsentSubmissionInput = z.infer<typeof ConsentSubmissionSchema>;
