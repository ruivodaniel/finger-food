/**
 * EmptyState — the one empty state of the app, so every empty state looks the same.
 * The kind sets the icon and the register; the two texts are the case's own:
 *
 *   nothing-yet   a collection with nothing in it
 *   no-results    a filter or a search matched nothing
 *   unavailable   it is not there, or it is not yours
 *
 * Wraps the library's EmptyState; modules receive this one through their provider.
 */
import { EmptyState as LibraryEmptyState, Icon, type IconName } from "@libs/web-components";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  kind?: "nothing-yet" | "no-results" | "unavailable";
  title: string;
  description?: ReactNode;
  /** replaces the kind's icon */
  icon?: IconName;
  action?: ReactNode;
  /** sm: inside a popover or a card */
  scale?: "sm" | "md";
  testId?: string;
}

const KIND_ICON: Record<NonNullable<EmptyStateProps["kind"]>, IconName> = {
  "nothing-yet": "inbox",
  "no-results": "search",
  unavailable: "accessDenied",
};

export function EmptyState({ kind = "nothing-yet", title, description, icon, action, scale, testId }: EmptyStateProps) {
  return (
    <LibraryEmptyState
      data-testid={testId}
      emphasis="quiet"
      icon={<Icon name={icon ?? KIND_ICON[kind]} />}
      title={title}
      description={description}
      action={action}
      scale={scale}
    />
  );
}
