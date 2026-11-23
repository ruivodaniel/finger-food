/**
 * CreditsExhaustedAlert — the notice a consumer shows where a metered action
 * was refused (a 402), one voice per refusal: a billing manager out of
 * balance is led to the billing page; a member at the end of their allocation
 * sees what is left and is told to ask their billing manager; a service
 * outside the plan names the plan that includes it. Exported for the consumer;
 * the slice places it nowhere itself.
 */

import * as React from "react";
import { Alert, AlertDescription, AlertTitle, Button } from "@libs/web-components";
import type { Allowance } from "../../../shared/types";
import { PERIOD_LABELS, credits } from "../helpers/format";

export type CreditsExhaustedAlertProps =
  | {
      /** the caller manages the owner's billing and the balance is short */
      voice: "manager";
      ownerName: string;
      balance: number;
      /** where the credits are bought — the owner's billing page */
      billingPath: string;
      onGetCredits?: (path: string) => void;
    }
  | {
      /** the caller is a member of the paying organization */
      voice: "member";
      ownerName: string;
      allowance: Allowance | null;
    }
  | {
      /** the owner's plan does not include the service */
      voice: "entitlement";
      ownerName: string;
      serviceName: string;
      planName: string;
      /** the caller manages the billing: they are led to the plan change */
      billingPath?: string;
      onChangePlan?: (path: string) => void;
    };

export function CreditsExhaustedAlert(props: CreditsExhaustedAlertProps): React.ReactElement {
  if (props.voice === "manager") {
    return (
      <Alert status="error" data-testid="credits-exhausted-manager">
        <AlertTitle>Not enough credits</AlertTitle>
        <AlertDescription>
          {props.ownerName} has {credits(props.balance)} left. Buy a bundle or choose a plan to continue.
        </AlertDescription>
        <Button
          emphasis="secondary"
          status="error"
          scale="sm"
          data-testid="get-credits"
          onClick={() => (props.onGetCredits ? props.onGetCredits(props.billingPath) : window.location.assign(props.billingPath))}
        >
          Get credits
        </Button>
      </Alert>
    );
  }
  if (props.voice === "entitlement") {
    const path = props.billingPath;
    return (
      <Alert status="info" data-testid="credits-exhausted-entitlement">
        <AlertTitle>
          {props.serviceName} is not in the {props.planName} plan
        </AlertTitle>
        <AlertDescription>
          {path ? `Change ${props.ownerName}'s plan to use it.` : `Ask your billing manager to change ${props.ownerName}'s plan.`}
        </AlertDescription>
        {path && (
          <Button emphasis="secondary" scale="sm" data-testid="change-plan" onClick={() => (props.onChangePlan ? props.onChangePlan(path) : window.location.assign(path))}>
            See the plans
          </Button>
        )}
      </Alert>
    );
  }
  const a = props.allowance;
  return (
    <Alert status="warning" data-testid="credits-exhausted-member">
      <AlertTitle>{a ? "Your allocation is used up" : "Not enough credits"}</AlertTitle>
      <AlertDescription>
        {a
          ? `You may spend ${credits(a.credits)} ${PERIOD_LABELS[a.period]} in ${props.ownerName}; ${credits(a.remaining)} left. Ask your billing manager for more.`
          : `${props.ownerName} has no credits left. Ask your billing manager.`}
      </AlertDescription>
    </Alert>
  );
}
