/**
 * ConsentCheckboxes — the registration screen's consent section. Normalizes
 * the config's raw consent items (platform scope) into the shared
 * ConsentDecisionList shape, pairing each with its current published
 * document through the query cache.
 */

import * as React from "react";
import { useQueries } from "@tanstack/react-query";
import { ConsentDecisionList } from "../../../shared/components/ConsentDecisionList";
import { legalDocumentHref } from "../../../shared/helpers/legal-doc-paths";
import type { LegalConsentItem } from "../../../../shared/auth-config/types";
import type { ConsentItemDocumentView } from "../../../../shared/types/domain";
import { legalDocumentsService } from "../../../services/application/legal-documents.service";

export interface ConsentCheckboxesProps {
  items: LegalConsentItem[];
  decisions: Record<string, boolean>;
  onDecisionChange: (type: string, accepted: boolean) => void;
}

export function ConsentCheckboxes({
  items,
  decisions,
  onDecisionChange,
}: ConsentCheckboxesProps): React.ReactElement {
  const shown = items.filter((item) => item.shown);
  const documentQueries = useQueries({
    queries: shown.map((item) => ({
      ...legalDocumentsService.getLatestVersion(item.type),
      staleTime: 5 * 60 * 1000, // titles don't move mid-signup
      retry: false, // an unpublished doc 404s — the type name is the fallback
    })),
  });

  const view: ConsentItemDocumentView[] = shown.map((item, i) => {
    const doc = documentQueries[i]?.data;
    return {
      type: item.type,
      consent: item.consent === true,
      mandatory: item.consent === true && item.mandatory !== false,
      document: doc
        ? { id: doc.id, title: doc.title, version: doc.version }
        : null,
    };
  });

  return (
    <ConsentDecisionList
      items={view}
      decisions={decisions}
      onDecisionChange={onDecisionChange}
      viewerHrefFor={(item) =>
        item.document
          ? legalDocumentHref(item.type, { docId: item.document.id })
          : undefined
      }
      testIdPrefix="register-consent"
    />
  );
}
