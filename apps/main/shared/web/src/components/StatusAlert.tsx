/**
 * StatusAlert — a message with a status (error, warning, success, info): the error
 * under a form, the warning at the top of a page. Wraps the library's Alert.
 */
import { Alert, AlertDescription } from "@libs/web-components";
import type { ReactNode } from "react";

export interface StatusAlertProps {
  status: "error" | "warning" | "success" | "info";
  children: ReactNode;
  testId?: string;
}

export function StatusAlert({ status, children, testId }: StatusAlertProps) {
  return (
    <Alert status={status} data-testid={testId}>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
