// A button with a confirm: archive a branch. Its versions stay in the history, and nothing more is written on it. Not main.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button } from "@libs/web-components";
import { versioningService } from "../../services/application/versioning.service";

interface ArchiveBranchProps {
  entity: string;
  entityId: string;
  branch: string;
  onArchived: () => void;
}

export function ArchiveBranch({ entity, entityId, branch, onArchived }: ArchiveBranchProps) {
  const queryClient = useQueryClient();
  const archive = useMutation({
    mutationFn: () => versioningService.archiveBranch(entity, entityId, branch),
    onSettled: () => queryClient.invalidateQueries({ queryKey: versioningService.keys.entity(entity, entityId) }),
    onSuccess: onArchived,
  });
  if (branch === "main") return null;
  return (
    <>
      {archive.error ? <span element="type--body-small" status="error" data-testid="branch-archive-error">{archive.error.message}</span> : null}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button scale="sm" emphasis="tertiary" disabled={archive.isPending} data-testid="branch-archive">Archive branch</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {branch}?</AlertDialogTitle>
            <AlertDialogDescription>Its versions stay in the history, and can be compared, merged from or branched from. Nothing more can be saved on it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => archive.mutate()} data-testid="branch-archive-confirm">Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
