/**
 * Human-facing descriptions of gate obligations. The gate answers a blocked
 * request with `{ obligations }` (428); the client turns those into a clear
 * message. Resolution happens in place on /resolve (ObligationResolver), so
 * a description is a label, never a link.
 */

import type { Obligation } from "../../shared/auth-config/resolver";

export interface ObligationHint {
  /** One-line, user-facing. */
  label: string;
}

/** Describe a single obligation for a person. */
export function describeObligation(o: Obligation): ObligationHint {
  switch (o.require) {
    case "factor_session_verified":
      if (o.factorMethod === "totp") {
        return { label: "Verify with two-factor authentication" };
      }
      if (o.factorMethod === "password") {
        return { label: "Sign in with your password" };
      }
      return { label: "Complete an extra sign-in step" };
    case "identifier_verified": {
      // Any-of: any listed identifier type satisfies the obligation.
      const what = o.identityTypes?.join(" or ") ?? "contact";
      return { label: `Verify your ${what} address` };
    }
    case "identifier_present": {
      const what = o.identityTypes?.join(" or ") ?? "contact";
      return {
        label: `Add a${what.startsWith("email") ? "n" : ""} ${what} address`,
      };
    }
    case "profile_data_provided":
      return { label: `Provide your ${o.dataField ?? "profile details"}` };
    case "legal_consent_granted":
      return { label: "Accept the latest terms" };
    default:
      return { label: "Finish setting up your account" };
  }
}

/** A single message summarizing everything a blocked caller still owes. */
export function summarizeObligations(obligations: Obligation[]): string {
  const labels = obligations.map((o) => describeObligation(o).label);
  if (labels.length === 0) return "Finish setting up your account to continue.";
  if (labels.length === 1) return `${labels[0]} to continue.`;
  return `To continue: ${labels.join("; ")}.`;
}
