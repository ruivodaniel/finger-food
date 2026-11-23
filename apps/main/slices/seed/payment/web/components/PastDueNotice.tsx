/**
 * PastDueNotice — shown on a billing page while the subscription is past
 * due: what failed, that the credits stay, and the way into the Customer
 * portal (where the card gets updated).
 */

import * as React from "react";
import { Alert, AlertDescription, AlertTitle, Button } from "@libs/web-components";

export interface PastDueNoticeProps {
  ownerName: string;
  planName: string;
  onPortal: () => void;
  busy?: boolean;
}

export function PastDueNotice({ ownerName, planName, onPortal, busy }: PastDueNoticeProps): React.ReactElement {
  return (
    <Alert status="warning" data-testid="past-due-notice">
      <AlertTitle>Renewal payment failed</AlertTitle>
      <AlertDescription>
        The {planName} plan of {ownerName} could not be renewed. The credits stay as they are; update the card in Stripe to keep the plan.
      </AlertDescription>
      <Button emphasis="secondary" status="warning" scale="sm" startIcon="link" buttonType="icon-text" disabled={busy} onClick={onPortal} data-testid="past-due-portal">
        Manage in Stripe
      </Button>
    </Alert>
  );
}
