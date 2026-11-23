// A button with a confirm: restore this version as the next one on its branch. The host does the restoring.
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button } from "@libs/web-components";
import type { VersionView } from "../../../shared/types";

export function Restore({ version, disabled, onRestore }: { version: VersionView; disabled: boolean; onRestore: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button emphasis="secondary" scale="sm" startIcon="undo" disabled={disabled} data-testid="version-restore" aria-label={`Restore ${version.label}`}>Restore</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore {version.label}?</AlertDialogTitle>
          <AlertDialogDescription>A new version on {version.branch} with this content. Nothing is deleted: the current head stays in the history.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onRestore} data-testid="version-restore-confirm">Restore</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
