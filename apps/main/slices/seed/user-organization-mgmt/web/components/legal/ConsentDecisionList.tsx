/**
 * ConsentDecisionList — the one renderer for consent items, honoring the
 * DSL's three states: `consent: true` → checkbox ("(required)" only when
 * mandatory AND a published document exists — a waived item is never
 * demanded); `consent: false` → informational row, no checkbox. `shown:
 * false` items never reach this component (the server projection drops
 * them). Mandatory enforcement stays server-side.
 */

import * as React from "react";
import { Checkbox } from "@libs/web-components";
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
    <Stack dir="col" gap={8}>
      {items.map((item) => {
        const href = item.document ? viewerHrefFor?.(item) : undefined;
        const title = (
          <span element="type--body-small">
            {href ? (
              <a
                element="type--link"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.document?.title ?? item.type}
              </a>
            ) : (
              (item.document?.title ?? item.type)
            )}
            {item.consent &&
              (item.mandatory && item.document !== null
                ? " (required)"
                : " (optional)")}
          </span>
        );

        if (!item.consent) {
          // informational — shown, never consented to
          return (
            <span key={item.type} element="type--body" data-testid={`${testIdPrefix}-info-${item.type}`}>
              {title}
            </span>
          );
        }
        return (
          <label key={item.type} style={{ cursor: "pointer" }}>
            <Stack dir="row" gap={8} align="center">
            <Checkbox
              data-testid={`${testIdPrefix}-${item.type}`}
              checked={decisions[item.type] ?? false}
              onCheckedChange={(checked) =>
                onDecisionChange(item.type, checked === true)
              }
            />
            {title}
            </Stack>
          </label>
        );
      })}
    </Stack>
  );
}
