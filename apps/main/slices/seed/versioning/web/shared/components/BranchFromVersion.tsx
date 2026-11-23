// A button with a form: a new branch from this version, leaving its own branch as it is. The host does the branching.
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Input } from "@libs/web-components";
import type { VersionView } from "../../../shared/types";

interface BranchFromVersionProps {
  version: VersionView;
  /** Names a branch of this entity has, or had. */
  takenNames: string[];
  disabled: boolean;
  onBranch: (name: string) => void;
}

export function BranchFromVersion({ version, takenNames, disabled, onBranch }: BranchFromVersionProps) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const taken = takenNames.includes(trimmed);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button emphasis="tertiary" scale="sm" disabled={disabled} data-testid="version-branch" aria-label={`Branch from ${version.label}`}>Branch</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Branch from {version.label}?</AlertDialogTitle>
          <AlertDialogDescription>A new branch that starts with this content. {version.branch} doesn't change.</AlertDialogDescription>
        </AlertDialogHeader>
        <Input value={name} onChange={setName} placeholder="Branch name" data-testid="version-branch-name" />
        {taken ? <span element="type--body-small" status="error" data-testid="version-branch-taken">This entity already has a branch called {trimmed}.</span> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!trimmed || taken} onClick={() => onBranch(trimmed)} data-testid="version-branch-confirm">Branch</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
