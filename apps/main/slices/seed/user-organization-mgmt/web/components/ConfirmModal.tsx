/**
 * ConfirmModal — the app's when it injected one, the module's own otherwise.
 * Pages import this, never the library's.
 */
import type * as React from "react";
import { useComponents } from "../hooks/use-components";
import type { ConfirmModalComponentProps } from "../types";

export function ConfirmModal(props: ConfirmModalComponentProps): React.ReactElement {
  const { ConfirmModal: Impl } = useComponents();
  return <Impl {...props} />;
}
