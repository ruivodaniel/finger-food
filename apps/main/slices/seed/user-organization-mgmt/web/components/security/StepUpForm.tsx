/**
 * StepUpForm — raise the current session to AAL2 before a protected
 * settings change (e.g. disabling 2FA). Accepts a TOTP code or a one-time
 * backup code.
 */

import * as React from "react";
import { Button, Input } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { ApiError } from "../../lib/api-client";

export interface StepUpFormProps {
  onStepUp: () => void | Promise<void>;
  onCancel: () => void;
}

export function StepUpForm({
  onStepUp,
  onCancel,
}: StepUpFormProps): React.ReactElement {
  const { client } = useUserOrgMgmtContext();
  const [code, setCode] = React.useState("");
  const [useBackupCode, setUseBackupCode] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await client.securityStepUp({
        code,
        method: useBackupCode ? "backup_code" : "totp",
      });
      await onStepUp();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      data-testid="step-up-prompt"
      onSubmit={submit}
    >
      <Stack dir="col" gap={12}>
      <p element="type--body-small">
        {useBackupCode
          ? "Enter one of your backup codes to continue."
          : "Enter a code from your authenticator to continue."}
      </p>
      <Input
        data-testid="step-up-input"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={useBackupCode ? "backup code" : "6-digit code"}
        autoFocus
      />
      <Stack dir="row" gap={8}>
        <Button
          data-testid="step-up-submit"
          type="submit"
          disabled={submitting || code.length === 0}
        >
          Confirm
        </Button>
        <Button
          data-testid="step-up-cancel"
          emphasis="secondary"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </Stack>
      <p element="type--body-small">
        <a
          element="type--link"
          data-testid="step-up-toggle"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setUseBackupCode((v) => !v);
            setCode("");
            setError(null);
          }}
        >
          {useBackupCode
            ? "Use the authenticator app instead"
            : "Use a backup code instead"}
        </a>
      </p>
      {error && (
        <p element="type--body-small" data-testid="step-up-error" role="alert">
          {error}
        </p>
      )}
      </Stack>
    </form>
  );
}
