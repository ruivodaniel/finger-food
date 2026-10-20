/**
 * NotificationRow — one in-app notification: its rendered copy, how long ago,
 * and the two things the reader can do to it.
 *
 * Read state is explicit rather than inferred from a click, so "did the badge
 * clear" has one cause.
 */

import * as React from "react";
import { Button } from "@libs/web-components";
import { relativeTime } from "../lib/relative-time";
import type { NotificationInboxItem } from "../../shared/types";

export interface NotificationRowProps {
  item: NotificationInboxItem;
  onSeen: (deliveryId: string) => void;
  onDismiss: (deliveryId: string) => void;
}

export function NotificationRow({
  item,
  onSeen,
  onDismiss,
}: NotificationRowProps): React.ReactElement {
  const unseen = item.seenAt === null;

  return (
    <li
      data-testid={`notification-row-${item.id}`}
      data-unseen={unseen ? "true" : "false"}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        padding: "8px 4px",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          element="type--body-small"
          data-testid={`notification-row-${item.id}-title`}
          style={{ fontWeight: unseen ? 600 : 400 }}
        >
          {item.title}
        </div>
        <div
          element="type--body-small"
          data-testid={`notification-row-${item.id}-body`}
          style={{ opacity: 0.8 }}
        >
          {item.body}
        </div>
        <div element="type--body-small" style={{ opacity: 0.5 }}>
          {relativeTime(item.createdAt)}
        </div>
      </div>
      {unseen && (
        <Button
          emphasis="quiet"
          scale="xs"
          data-testid={`notification-row-${item.id}-seen-button`}
          onClick={() => onSeen(item.id)}
        >
          Mark read
        </Button>
      )}
      <Button
        emphasis="quiet"
        scale="xs"
        buttonType="icon"
        startIcon="close"
        aria-label="Dismiss"
        data-testid={`notification-row-${item.id}-dismiss-button`}
        onClick={() => onDismiss(item.id)}
      />
    </li>
  );
}
