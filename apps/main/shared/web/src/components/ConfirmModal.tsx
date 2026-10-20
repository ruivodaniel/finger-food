/**
 * ConfirmModal — a confirmation the user answers (leave, remove). `children` sits
 * between the text and the buttons: a phrase to type, for the ones that need it.
 * Wraps the library's AlertDialog.
 */
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
import type { ReactNode } from "react";

export interface ConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmDisabled?: boolean;
  confirmDisabledReason?: string;
  cancelTestId?: string;
  confirmTestId?: string;
  children?: ReactNode;
}

export function ConfirmModal({
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
}: ConfirmModalProps) {
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
