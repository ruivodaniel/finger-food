/**
 * BundleGrid — the catalog's bundles, each a tile with a Buy that opens
 * Stripe Checkout. What the bundle costs is Stripe's to show.
 */

import * as React from "react";
import { Button, Card, CardContent, CardHeader, Tile } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { PaymentBundle } from "../../shared/catalog";
import { plainCredits } from "../lib/format";
import { TestCardHint } from "./TestCardHint";

export interface BundleGridProps {
  bundles: readonly PaymentBundle[];
  onBuy: (bundleKey: string) => void;
  busy?: boolean;
  /** Stripe runs in test mode: name the test card under the buttons */
  testMode?: boolean;
}

export function BundleGrid({ bundles, onBuy, busy, testMode }: BundleGridProps): React.ReactElement {
  return (
    <Card data-testid="bundle-grid">
      <CardHeader>
        <h3 element="type--heading4">Buy credits</h3>
      </CardHeader>
      <CardContent>
        <Stack dir="row" scale="md" wrap>
          {bundles.map((b) => (
            <Tile key={b.key} className="flex-1 min-w-36" data-testid={`bundle-${b.key}`}>
              <Stack dir="col" scale="2xs">
                <span element="type--heading4">{b.name}</span>
                <span element="type--body-small" emphasis="quiet">
                  {plainCredits(b.credits)} · never expire
                </span>
                <Button emphasis="secondary" scale="sm" disabled={busy} onClick={() => onBuy(b.key)} data-testid={`buy-bundle-${b.key}`}>
                  Buy
                </Button>
              </Stack>
            </Tile>
          ))}
        </Stack>
        {testMode && (
          <div className="mt-3">
            <TestCardHint />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
