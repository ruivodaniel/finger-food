// A document's lock, where the document is shown: who locked it, and Lock or Unlock when the server says the caller may.
import * as React from "react";
import { Badge, Button } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useDocumentLock } from "../hooks/use-document-lock";

export function LockToggle({ kind, documentId }: { kind: string; documentId: string }): React.ReactElement | null {
  const { lock, canLock, canUnlock, isLoading, doLock, doUnlock } = useDocumentLock(kind, documentId);
  if (isLoading) return null;
  return (
    <Stack dir="row" scale="sm" align="center" data-testid="lock-toggle">
      {lock && <Badge emphasis="quiet" status="warning" data-testid="lock-badge">Locked by {lock.lockedByName}</Badge>}
      {!lock && canLock && (
        <Button buttonType="icon-text" startIcon="lock" emphasis="secondary" scale="sm" data-testid="lock-btn" disabled={doLock.isPending} onClick={() => doLock.mutate()}>Lock</Button>
      )}
      {lock && canUnlock && (
        <Button buttonType="icon-text" startIcon="unlock" emphasis="secondary" scale="sm" data-testid="unlock-btn" disabled={doUnlock.isPending} onClick={() => doUnlock.mutate()}>Unlock</Button>
      )}
    </Stack>
  );
}
