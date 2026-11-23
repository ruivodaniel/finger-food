/**
 * NotificationCenter — the panel behind the bell: the caller's in-app rows,
 * newest first, or an empty state.
 *
 * It is the popover's content, so it only renders when opened — which is also
 * when a fresh read is worth doing.
 */

import * as React from "react";
import {
  EmptyState,
  Icon,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  ScrollArea,
} from "@libs/web-components";
import { useQuery } from "@tanstack/react-query";
import { inboxService } from "../../services/application/inbox.service";
import { isUnavailable } from "../helpers/api-error";
import { NotificationRow } from "./NotificationRow";

export function NotificationCenter(): React.ReactElement {
  const inbox = useQuery(inboxService.getInbox());
  const items = inbox.data?.items ?? [];
  const isReady = !inbox.isPending || isUnavailable(inbox.error);

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
          data-testid="notifications-center-empty"
          emphasis="quiet"
          icon={<Icon name="inbox" />}
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
                onSeen={(id) => void inboxService.markSeen(id)}
                onDismiss={(id) => void inboxService.dismiss(id)}
              />
            ))}
          </ul>
        </ScrollArea>
      )}
    </PopoverContent>
  );
}
