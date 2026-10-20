/** The module's own status alert: what it renders when the app injects none. */
import type * as React from "react";
import { Alert, AlertDescription } from "@libs/web-components";
import type { StatusAlertComponentProps } from "../types";

export function DefaultStatusAlert({ status, children, testId }: StatusAlertComponentProps): React.ReactElement {
  return (
    <Alert status={status} data-testid={testId}>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
