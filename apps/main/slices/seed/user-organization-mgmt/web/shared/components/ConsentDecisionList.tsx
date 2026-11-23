/**
 * ConsentDecisionList — the one renderer for consent items, honoring the
 * DSL's three states: `consent: true` → checkbox ("(required)" only when
 * mandatory AND a published document exists — a waived item is never
 * demanded); `consent: false` → informational row, no checkbox. `shown:
 * false` items never reach this component (the server projection drops
 * them). Mandatory enforcement stays server-side.
 */

import * as React from "react";
import { Checkbox, Text, Link } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { ConsentItemDocumentView } from "../../../shared/types/domain";

export interface ConsentDecisionListProps {
  items: ConsentItemDocumentView[];
  decisions: Record<string, boolean>;
  onDecisionChange: (type: string, accepted: boolean) => void;
  /** Link target for an item's document title (viewer page). */
  viewerHrefFor?: (item: ConsentItemDocumentView) => string | undefined;
  /** data-testid prefix — `${prefix}-${type}` per checkbox. */
  testIdPrefix?: string;
}

export function ConsentDecisionList({
  items,
  decisions,
  onDecisionChange,
  viewerHrefFor,
  testIdPrefix = "consent",
}: ConsentDecisionListProps): React.ReactElement {
  return (
    <Stack dir="col" scale="sm">
      {items.map((item) => {
        const href = item.document ? viewerHrefFor?.(item) : undefined;
        const title = (
          <Text type="body-small">
            {href ? (
              <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.document?.title ?? item.type}
              </Link>
            ) : (
              (item.document?.title ?? item.type)
            )}
            {item.consent &&
              (item.mandatory && item.document !== null
                ? " (required)"
                : " (optional)")}
          </Text>
        );

        if (!item.consent) {
          // informational — shown, never consented to
          return (
            <Text type="body" key={item.type} data-testid={`${testIdPrefix}-info-${item.type}`}>
              {title}
            </Text>
          );
        }
        return (
          <Text as="label" type="body-small" key={item.type}>
            <Stack dir="row" scale="sm" align="center">
            <Checkbox
              data-testid={`${testIdPrefix}-${item.type}`}
              checked={decisions[item.type] ?? false}
              onCheckedChange={(checked) =>
                onDecisionChange(item.type, checked === true)
              }
            />
            {title}
            </Stack>
          </Text>
        );
      })}
    </Stack>
  );
}
