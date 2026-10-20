/**
 * StatusAlert — the app's when it injected one, the module's own otherwise.
 * Pages import this, never the library's.
 */
import type * as React from "react";
import { useComponents } from "../hooks/use-components";
import type { StatusAlertComponentProps } from "../types";

export function StatusAlert(props: StatusAlertComponentProps): React.ReactElement {
  const { StatusAlert: Impl } = useComponents();
  return <Impl {...props} />;
}
