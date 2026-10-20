/**
 * EmptyState — the empty state a page renders: the app's when it injected one,
 * the module's own otherwise. Pages import this, never the library's.
 */
import type * as React from "react";
import { useComponents } from "../hooks/use-components";
import type { EmptyStateComponentProps } from "../types";

export function EmptyState(props: EmptyStateComponentProps): React.ReactElement {
  const { EmptyState: Impl } = useComponents();
  return <Impl {...props} />;
}
