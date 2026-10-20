/**
 * ResetPasswordPage — set the new password on the session /forgot-password's
 * code proof created. Needs only that session (the server treats
 * identifierType as optional); a caller who lands here signed out is sent
 * back to start over. Rotates the password when one existed, adds a first
 * one otherwise. Finishing revokes every session, this one included.
 *
 * A heading block (the title over the stage's intro), the form a Stack of one
 * labelled field under a filling primary; the no-session and done messages,
 * and errors, as Alerts. No inline styles.
 */

import * as React from "react";
import { Button, Input, Label } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession, useInvalidateSession } from "../../hooks/use-session";
import { ApiError } from "../../lib/api-client";
import { StatusAlert } from "../../components/StatusAlert";

export interface ResetPasswordPageProps {
  loginPath?: string;
  /** Where to start over when there is no recovery session. */
  forgotPasswordPath?: string;
}

type Stage = "finish" | "done";

export function ResetPasswordPage({
  loginPath = "/login",
  forgotPasswordPath = "/forgot-password",
}: ResetPasswordPageProps): React.ReactElement | null {
  const { client, router } = useUserOrgMgmtContext();
  const invalidateSession = useInvalidateSession();
  const { data: sessionData, isLoading: sessionLoading } = useSession();

  const [stage, setStage] = React.useState<Stage>("finish");
  const [newPassword, setNewPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (sessionLoading) return null;

  if (stage === "finish" && !sessionData?.session) {
    return (
      <Stack dir="col" gap={20} data-testid="recovery-page">
        <Stack dir="col" gap={4}>
          <h1 element="type--heading2">Reset your password</h1>
          <span element="type--body-small" emphasis="quiet">
            Choose a new password. This signs you out everywhere, on every
            device.
          </span>
        </Stack>
        <StatusAlert status="warning" testId="recovery-no-session">
            <span>
              This step follows a recovery code.{" "}
              <a
                element="type--link"
                href={forgotPasswordPath}
                onClick={(e) => {
                  e.preventDefault();
                  void router?.navigate({ to: forgotPasswordPath });
                }}
              >
                Start over to get one.
              </a>
            </span>
          </StatusAlert>
      </Stack>
    );
  }

  return (
    <Stack dir="col" gap={20} data-testid="recovery-page">
      <Stack dir="col" gap={4}>
        <h1 element="type--heading2">Reset your password</h1>
        <span element="type--body-small" emphasis="quiet">
          {stage === "finish"
            ? "Choose a new password. This signs you out everywhere, on every device."
            : "Your password has been changed."}
        </span>
      </Stack>

      {stage === "finish" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            setError(null);
            void (async () => {
              try {
                await client.recoveryFinish({ newPassword });
                await invalidateSession();
                setStage("done");
              } catch (err) {
                setError(
                  err instanceof ApiError
                    ? err.message
                    : "something went wrong",
                );
              } finally {
                setSubmitting(false);
              }
            })();
          }}
        >
          <Stack dir="col" gap={16}>
            <Stack dir="col" gap={6}>
              <Label htmlFor="recovery-password">New password</Label>
              <Input
                id="recovery-password"
                data-testid="recovery-password-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="new password"
                autoComplete="new-password"
                autoFocus
              />
            </Stack>
            <Button
              data-testid="recovery-finish-submit"
              type="submit"
              fill
              disabled={submitting || newPassword.length === 0}
            >
              Set new password
            </Button>
          </Stack>
        </form>
      )}

      {stage === "done" && (
        <StatusAlert status="success" testId="recovery-done">
            <span>
              All set — you've been signed out everywhere.{" "}
              <a
                element="type--link"
                href={loginPath}
                onClick={(e) => {
                  e.preventDefault();
                  void router?.navigate({ to: loginPath });
                }}
              >
                Sign in with your new password.
              </a>
            </span>
          </StatusAlert>
      )}

      {error && (
        <StatusAlert status="error" testId="recovery-error">{error}</StatusAlert>
      )}
    </Stack>
  );
}
