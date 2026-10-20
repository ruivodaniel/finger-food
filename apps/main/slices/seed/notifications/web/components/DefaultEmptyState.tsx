/** The module's own empty state: what it renders when the app injects none. */
import type * as React from "react";
import { EmptyState as LibraryEmptyState, Icon, type IconName } from "@libs/web-components";
import type { EmptyStateComponentProps } from "../types";

const KIND_ICON: Record<NonNullable<EmptyStateComponentProps["kind"]>, IconName> = {
  "nothing-yet": "inbox",
  "no-results": "search",
  unavailable: "accessDenied",
};

export function DefaultEmptyState({
  kind = "nothing-yet",
  title,
  description,
  icon,
  scale,
  testId,
}: EmptyStateComponentProps): React.ReactElement {
  return (
    <LibraryEmptyState
      data-testid={testId}
      emphasis="quiet"
      icon={<Icon name={icon ?? KIND_ICON[kind]} />}
      title={title}
      description={description}
      scale={scale}
    />
  );
}
