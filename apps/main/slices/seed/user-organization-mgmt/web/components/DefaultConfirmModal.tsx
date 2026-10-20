/** The module's own confirm modal: what it renders when the app injects none. */
import type * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@libs/web-components";
import type { ConfirmModalComponentProps } from "../types";

export function DefaultConfirmModal({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  confirmDisabled,
  confirmDisabledReason,
  cancelTestId,
  confirmTestId,
  children,
}: ConfirmModalComponentProps): React.ReactElement {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent status={destructive ? "destructive" : undefined}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={cancelTestId}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            data-testid={confirmTestId}
            status={destructive ? "destructive" : undefined}
            disabled={confirmDisabled}
            disabledReason={confirmDisabledReason}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
