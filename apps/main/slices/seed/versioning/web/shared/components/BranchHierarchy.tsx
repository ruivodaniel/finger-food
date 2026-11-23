// A button with a form: one branch on an entity and everything under it, each from its main head. The host says what to show next.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Input } from "@libs/web-components";
import { versioningService } from "../../services/application/versioning.service";

interface BranchHierarchyProps {
  entity: string;
  entityId: string;
  /** What the branch covers, in words: "this exploration and its tabs" */
  covers: string;
  onBranched: (name: string) => void;
}

export function BranchHierarchy({ entity, entityId, covers, onBranched }: BranchHierarchyProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const history = useQuery(versioningService.getHistory(entity, entityId));
  const branch = useMutation({
    mutationFn: (branchName: string) => versioningService.branchHierarchy(entity, entityId, branchName),
    // every entity under it has a new branch: every history is read again
    onSettled: () => queryClient.invalidateQueries({ queryKey: versioningService.keys.all }),
    onSuccess: (_branched, branchName) => { setName(""); onBranched(branchName); },
  });
  const trimmed = name.trim();
  const taken = trimmed === "main" || (history.data?.branches ?? []).some((candidate) => candidate.name === trimmed);
  return (
    <>
      {branch.error ? <span element="type--body-small" status="error" data-testid="branch-hierarchy-error">{branch.error.message}</span> : null}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button scale="sm" emphasis="tertiary" disabled={branch.isPending} data-testid="branch-hierarchy">Branch</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Branch {covers}?</AlertDialogTitle>
            <AlertDialogDescription>Each starts from what main has now. Main doesn't change.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={name} onChange={setName} placeholder="Branch name" data-testid="branch-hierarchy-name" />
          {taken ? <span element="type--body-small" status="error" data-testid="branch-hierarchy-taken">That name is taken.</span> : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={!trimmed || taken} onClick={() => branch.mutate(trimmed)} data-testid="branch-hierarchy-confirm">Branch</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
