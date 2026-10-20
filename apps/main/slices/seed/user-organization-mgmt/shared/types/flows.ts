// Auth wire types.
//
// A credential conversation is the PROVIDER's flow — the client holds its id
// and the module relays. There is no server-driven step machine, so the only
// thing the server projects here is what a screen may offer: the config,
// resolved for a context, with the raw rules kept server-side.

import type {
  FactorConfig,
  IdentifierName,
  LegalConsentItem,
} from "../auth-config/types";

/** Derived, safe auth options for a context — GET /api/auth/config. */
export interface AuthConfigView {
  identifiers: IdentifierName[];
  /** Factor keys the context allows (password, otp:phone, link:email). */
  factors: string[];
  passwordPolicy: FactorConfig | null;
  allowSpontaneousAccountCreation: boolean;
  socialProviders: { google: boolean; apple: boolean };
  /**
   * What registration collects in this context — the one screen renders these.
   * Mandatory enforcement stays server-side; this only says what to show.
   */
  consent: LegalConsentItem[];
  profileFields: string[];
}
