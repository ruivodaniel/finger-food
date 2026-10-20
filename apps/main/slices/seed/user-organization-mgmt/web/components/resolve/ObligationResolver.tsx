/**
 * ObligationResolver — mounts the component that satisfies ONE gate
 * obligation in place. The /resolve wizard renders exactly one at a time
 * (doctrine: obligations resolve one at a time, in fixed order); every
 * resolver invalidates the shared gate query on success, which is what
 * advances the wizard to the next obligation.
 */

import * as React from "react";
import type { Obligation } from "../../../shared/auth-config/resolver";
import { describeObligation } from "../../lib/obligations";
import { ProfileDataForm } from "../account/ProfileDataForm";
import { IdentifierResolution } from "../identifiers/IdentifierResolution";
import { TwoFactorCard } from "../security/TwoFactorCard";
import { ReconsentCard } from "../legal/ReconsentCard";
import { PasswordSignInCard } from "./PasswordSignInCard";
import { StatusAlert } from "../StatusAlert";

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
    <StatusAlert status="warning" testId="obligation-unresolvable">{describeObligation(obligation).label}</StatusAlert>
  );
}
