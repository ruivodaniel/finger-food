import * as React from "react";
import { useNotificationsContext } from "../providers/NotificationsProvider";
import { DefaultEmptyState } from "../components/DefaultEmptyState";
import type { NotificationsComponents } from "../types";

/** The shared components the app injected, over the module's own defaults. */
export function useComponents(): NotificationsComponents {
  const { components } = useNotificationsContext();
  return React.useMemo(() => ({ EmptyState: components?.EmptyState ?? DefaultEmptyState }), [components]);
}
