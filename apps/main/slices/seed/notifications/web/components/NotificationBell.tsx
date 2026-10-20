/**
 * NotificationBell — what an app shell embeds. A bell, a count of what the
 * caller hasn't read, and the center behind it.
 *
 * Renders NOTHING until the first read settles, and nothing at all when the
 * server declines to serve the caller — signed out, or still owing the app
 * something. The module has no session of its own to consult, so the endpoint's
 * answer IS the signal. A badge that flashes in and out on first paint reads as
 * a bug, so the guard is deliberate.
 */

import * as React from "react";
import { Badge, Button, Popover, PopoverTrigger } from "@libs/web-components";
import { useNotificationInbox } from "../hooks/use-notification-inbox";
import { NotificationCenter } from "./NotificationCenter";

export function NotificationBell(): React.ReactElement | null {
  const { unseenCount, isReady, isUnavailable } = useNotificationInbox();

  if (!isReady || isUnavailable) return null;

  return (
    <Popover>
      {/* The count sits outside the trigger: an icon-only Button renders its
          own icon and no children. flexShrink 0 — a crowded header row must
          squeeze its siblings, never the bell. */}
      <span style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
        <PopoverTrigger asChild>
          <Button
            emphasis="quiet"
            scale="sm"
            buttonType="icon"
            startIcon="bell"
            aria-label={
              unseenCount > 0
                ? `Notifications (${unseenCount} unread)`
                : "Notifications"
            }
            data-testid="notifications-bell-button"
          />
        </PopoverTrigger>
        {unseenCount > 0 && (
          <Badge
            status="info"
            scale="xs"
            data-testid="notifications-bell-badge"
            style={{
              // Overlap the button's corner, not its glyph: the badge hangs
              // half outside the button, so the host row must leave it room.
              position: "absolute",
              top: -6,
              right: -6,
              pointerEvents: "none",
            }}
          >
            {unseenCount}
          </Badge>
        )}
      </span>
      <NotificationCenter />
    </Popover>
  );
}
