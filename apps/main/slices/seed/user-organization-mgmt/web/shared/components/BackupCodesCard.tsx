import * as React from "react";
import { Button, Text } from "@libs/web-components";
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
    <Stack dir="col" scale="md" data-testid="backup-codes-card">
      <Text as="h2" type="heading4">Save your backup codes</Text>
      <Text as="p" type="body-small">
        Each code works once if you lose your authenticator. Store them
        somewhere safe — they won't be shown again.
      </Text>
      <Stack dir="row" wrap scale="sm" data-testid="backup-codes-list">
        {codes.map((code) => (
          <Text type="code" key={code} data-testid={`backup-code-${code}`}>
            {code}
          </Text>
        ))}
      </Stack>
      <Stack dir="row" scale="sm">
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