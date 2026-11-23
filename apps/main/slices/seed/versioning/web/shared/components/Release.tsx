// A button with a form: promote this version of main to the next release, with a title and a description. The host does the releasing.
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Input } from "@libs/web-components";
import type { VersionView } from "../../../shared/types";

interface ReleaseProps {
  version: VersionView;
  /** The number it would get. */
  number: number;
  disabled: boolean;
  onRelease: (title: string, description: string) => void;
}

export function Release({ version, number, disabled, onRelease }: ReleaseProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button emphasis="tertiary" scale="sm" disabled={disabled} data-testid="version-release" aria-label={`Release ${version.label}`}>Release</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Release {version.label} as {number}.0?</AlertDialogTitle>
          <AlertDialogDescription>Versions from here on count from release {number}.</AlertDialogDescription>
        </AlertDialogHeader>
        <Input value={title} onChange={setTitle} placeholder="Title" data-testid="version-release-title" />
        <Input value={description} onChange={setDescription} placeholder="Description" data-testid="version-release-description" />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!title.trim()} onClick={() => onRelease(title.trim(), description.trim())} data-testid="version-release-confirm">Release</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
