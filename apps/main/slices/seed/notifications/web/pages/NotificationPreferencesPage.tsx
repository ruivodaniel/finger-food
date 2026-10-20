/**
 * NotificationPreferencesPage — the caller's switchboard, one switch per
 * message type × channel.
 *
 * Only mutable rows render. Pinned types (`editable: false`) stay off the
 * page — a switch the caller can't move only invites confusion, and the
 * intro line already states that security and account messages always
 * arrive. Page chrome belongs to the app.
 */

import * as React from "react";
import { Switch } from "@libs/web-components";
import { useNotificationPreferences } from "../hooks/use-notification-preferences";
import { NOTIFICATION_CHANNELS } from "../../shared/types";
import type { NotificationChannel } from "../../shared/types";

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  in_app: "In app",
  email: "Email",
  sms: "SMS",
};

/** `organization` → `Organization`; the registry key is the product's word. */
function labelOf(messageType: string): string {
  const spaced = messageType.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function NotificationPreferencesPage(): React.ReactElement | null {
  const { items, isReady, isUnavailable, error, setPreference } =
    useNotificationPreferences();

  if (!isReady || isUnavailable) return null;

  const editableItems = items.filter((item) => item.editable);
  const messageTypes = [
    ...new Set(editableItems.map((item) => item.messageType)),
  ];
  const rowFor = (messageType: string, channel: NotificationChannel) =>
    editableItems.find(
      (item) => item.messageType === messageType && item.channel === channel,
    );

  return (
    <div
      data-testid="notification-preferences-page"
      layout="col-section"
      style={{ maxWidth: 560, margin: "0 auto", gap: 16 }}
    >
      <h2 element="type--heading3">Notifications</h2>
      <p element="type--body-small" style={{ opacity: 0.8 }}>
        Choose how each kind of message reaches you. Security and account
        messages always arrive.
      </p>

      {error && (
        <p element="type--body-small" data-testid="notification-preferences-error">
          {error}
        </p>
      )}

      {messageTypes.map((messageType) => (
        <section
          key={messageType}
          data-testid={`notification-preferences-${messageType}`}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <h2 element="type--heading3">{labelOf(messageType)}</h2>
          {NOTIFICATION_CHANNELS.map((channel) => {
            const row = rowFor(messageType, channel);
            if (!row) return null;
            return (
              <label
                key={channel}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <Switch
                  checked={row.enabled}
                  data-testid={`notification-preference-${messageType}-${channel}-switch`}
                  onCheckedChange={(enabled) =>
                    void setPreference({ messageType, channel, enabled })
                  }
                />
                <span element="type--body-small">{CHANNEL_LABELS[channel]}</span>
              </label>
            );
          })}
        </section>
      ))}
    </div>
  );
}
