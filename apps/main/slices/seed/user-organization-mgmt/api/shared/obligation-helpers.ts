/**
 * Pure projections over resolved obligations — the flow service derives its
 * step list and consent items from a flow's pinned obligation set with these.
 */

import {
  obligationKey,
  type Obligation,
} from "../../shared/auth-config/resolver";
import type { LegalConsentItem } from "../../shared/auth-config/types";

/** Keep the first occurrence of each obligation (identity via obligationKey). */
export function dedupeObligations(obligations: Obligation[]): Obligation[] {
  const seen = new Set<string>();
  const out: Obligation[] = [];
  for (const o of obligations) {
    const key = obligationKey(o);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(o);
  }
  return out;
}

/** Flatten consent obligations into a unique-by-type consent item list. */
export function consentItemsOf(obligations: Obligation[]): LegalConsentItem[] {
  const items: LegalConsentItem[] = [];
  const seen = new Set<string>();
  for (const o of obligations) {
    if (o.require !== "legal_consent_granted" || !o.consent) continue;
    for (const item of o.consent) {
      if (seen.has(item.type)) continue;
      seen.add(item.type);
      items.push(item);
    }
  }
  return items;
}

/** The profile data fields the obligations demand. */
export function requiredDataFields(obligations: Obligation[]): string[] {
  return obligations
    .filter((o) => o.require === "profile_data_provided" && o.dataField)
    .map((o) => o.dataField as string);
}
