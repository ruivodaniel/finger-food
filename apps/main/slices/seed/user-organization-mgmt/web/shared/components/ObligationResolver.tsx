/**
 * ObligationResolver — mounts the component that satisfies ONE gate
 * obligation in place. The /resolve wizard renders exactly one at a time
 * (doctrine: obligations resolve one at a time, in fixed order); every
 * resolver invalidates the shared gate query on success, which is what
 * advances the wizard to the next obligation.
 */

import { Alert, AlertDescription } from "@libs/web-components";
import * as React from "react";
import type { Obligation } from "../../../shared/auth-config/resolver";
import { describeObligation } from "../helpers/obligations";
import { ProfileDataForm } from "./ProfileDataForm";
import { IdentifierResolution } from "./IdentifierResolution";
import { TwoFactorCard } from "./TwoFactorCard";
import { ReconsentCard } from "./ReconsentCard";
import { PasswordSignInCard } from "./PasswordSignInCard";

export interface ObligationResolverProps {
  obligation: Obligation;
  loginPath?: string;
}

export function ObligationResolver({
  obligation,
  loginPath,
}: ObligationResolverProps): React.ReactElement {
  switch (obligation.require) {
    case "profile_data_provided":
      return <ProfileDataForm />;
    case "identifier_present":
    case "identifier_verified":
      return <IdentifierResolution />;
    case "factor_session_verified":
      if (obligation.factorMethod === "totp") return <TwoFactorCard />;
      if (obligation.factorMethod === "password")
        return <PasswordSignInCard loginPath={loginPath} />;
      break;
    case "legal_consent_granted":
      return <ReconsentCard />;
  }
  // An obligation kind with no in-place resolver — name it, at least.
  return (
    <Alert status="warning" data-testid="obligation-unresolvable"><AlertDescription>{describeObligation(obligation).label}</AlertDescription></Alert>
  );
}
