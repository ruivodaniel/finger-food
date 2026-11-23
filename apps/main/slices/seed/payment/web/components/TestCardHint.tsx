/**
 * TestCardHint — beside a button that opens Stripe while Stripe runs in test
 * mode: the card that pays there. It is Stripe's test card; live mode
 * declines it.
 */

import * as React from "react";
import { Alert, AlertDescription } from "@libs/web-components";

export function TestCardHint(): React.ReactElement {
  return (
    <Alert status="info" data-testid="test-card-hint">
      <AlertDescription>
        <span>
          Test mode: pay with card{" "}
          <span element="type--code" className="select-all whitespace-nowrap">
            4242 4242 4242 4242
          </span>
          , any future date, any CVC.
        </span>
      </AlertDescription>
    </Alert>
  );
}
