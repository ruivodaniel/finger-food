import * as React from "react";
import { Button } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";

export interface BackupCodesCardProps {
  codes: string[];
  onDone: () => void;
}

export function BackupCodesCard({
  codes,
  onDone,
}: BackupCodesCardProps): React.ReactElement {
  const copy = () => {
    void navigator.clipboard?.writeText(codes.join("\n"));
  };

  const download = () => {
    const blob = new Blob([codes.join("\n") + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack dir="col" gap={12} data-testid="backup-codes-card">
      <h2 element="type--heading4">Save your backup codes</h2>
      <p element="type--body-small">
        Each code works once if you lose your authenticator. Store them
        somewhere safe — they won't be shown again.
      </p>
      <Stack dir="row" wrap gap={8} data-testid="backup-codes-list">
        {codes.map((code) => (
          <span key={code} element="type--code" data-testid={`backup-code-${code}`}>
            {code}
          </span>
        ))}
      </Stack>
      <Stack dir="row" gap={8}>
        <Button
          data-testid="backup-codes-copy"
          emphasis="secondary"
          type="button"
          onClick={copy}
        >
          Copy
        </Button>
        <Button
          data-testid="backup-codes-download"
          emphasis="secondary"
          type="button"
          onClick={download}
        >
          Download
        </Button>
        <Button data-testid="backup-codes-done" type="button" onClick={onDone}>
          I've saved them
        </Button>
      </Stack>
    </Stack>
  );
}