/**
 * NotificationCenter — the panel behind the bell: the caller's in-app rows,
 * newest first, or an empty state.
 *
 * It is the popover's content, so it only renders when opened — which is also
 * when a fresh read is worth doing.
 */

import * as React from "react";
import {
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  ScrollArea,
} from "@libs/web-components";
import { useNotificationInbox } from "../hooks/use-notification-inbox";
import { NotificationRow } from "./NotificationRow";
import { EmptyState } from "./EmptyState";

export function NotificationCenter(): React.ReactElement {
  const { items, isReady, markSeen, dismiss } = useNotificationInbox();

  return (
    <PopoverContent
      align="start"
      data-testid="notifications-center-panel"
      style={{ width: 340, padding: 8 }}
    >
      <PopoverHeader>
        <PopoverTitle>Notifications</PopoverTitle>
      </PopoverHeader>

      {isReady && items.length === 0 ? (
        <EmptyState
          kind="nothing-yet"
          testId="notifications-center-empty"
          title="Nothing new"
          description="Updates about your organizations show up here."
          scale="sm"
        />
      ) : (
        <ScrollArea style={{ maxHeight: 360 }}>
          <ul
            data-testid="notifications-center-list"
            style={{ display: "flex", flexDirection: "column" }}
          >
            {items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onSeen={(id) => void markSeen(id)}
                onDismiss={(id) => void dismiss(id)}
              />
            ))}
          </ul>
        </ScrollArea>
      )}
    </PopoverContent>
  );
}
