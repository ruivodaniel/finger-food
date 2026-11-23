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
import { Button, Input, Label, Alert, AlertDescription, Text, Link } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { authenticationService } from "../../services/application/authentication.service";
import { mounted } from "../../services/application/mount";
import { isApiError } from "../../shared/helpers/api-error";
import { useQuery } from "@tanstack/react-query";

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
  const { router } = mounted();
  const invalidateSession = authenticationService.refreshSession;
  const { data: sessionData, isLoading: sessionLoading } = useQuery(authenticationService.getSession());

  const [stage, setStage] = React.useState<Stage>("finish");
  const [newPassword, setNewPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (sessionLoading) return null;

  if (stage === "finish" && !sessionData?.session) {
    return (
      <Stack dir="col" scale="lg" data-testid="recovery-page">
        <Stack dir="col" scale="2xs">
          <Text as="h1" type="heading2">Reset your password</Text>
          <Text type="body-small" emphasis="quiet">
            Choose a new password. This signs you out everywhere, on every
            device.
          </Text>
        </Stack>
        <Alert status="warning" data-testid="recovery-no-session"><AlertDescription>
            <Text>
              This step follows a recovery code.{" "}
              <Link
                href={forgotPasswordPath}
                onClick={(e) => {
                  e.preventDefault();
                  void router?.navigate({ to: forgotPasswordPath });
                }}
              >
                Start over to get one.
              </Link>
            </Text>
          </AlertDescription></Alert>
      </Stack>
    );
  }

  return (
    <Stack dir="col" scale="lg" data-testid="recovery-page">
      <Stack dir="col" scale="2xs">
        <Text as="h1" type="heading2">Reset your password</Text>
        <Text type="body-small" emphasis="quiet">
          {stage === "finish"
            ? "Choose a new password. This signs you out everywhere, on every device."
            : "Your password has been changed."}
        </Text>
      </Stack>

      {stage === "finish" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            setError(null);
            void (async () => {
              try {
                await authenticationService.finishRecovery({ newPassword });
                await invalidateSession();
                setStage("done");
              } catch (err) {
                setError(
                  isApiError(err)
                    ? err.message
                    : "something went wrong",
                );
              } finally {
                setSubmitting(false);
              }
            })();
          }}
        >
          <Stack dir="col" scale="lg">
            <Stack dir="col" scale="xs">
              <Label htmlFor="recovery-password">New password</Label>
              <Input
                id="recovery-password"
                data-testid="recovery-password-input"
                type="password"
                value={newPassword}
                onChange={(value) => setNewPassword(value)}
                placeholder="new password"
                autoComplete="new-password"
                autoFocus
              />
            </Stack>
            <Button
              data-testid="recovery-finish-submit"
              type="submit" position="fill"
              disabled={submitting || newPassword.length === 0}
            >
              Set new password
            </Button>
          </Stack>
        </form>
      )}

      {stage === "done" && (
        <Alert status="success" data-testid="recovery-done"><AlertDescription>
            <Text>
              All set — you've been signed out everywhere.{" "}
              <Link
                href={loginPath}
                onClick={(e) => {
                  e.preventDefault();
                  void router?.navigate({ to: loginPath });
                }}
              >
                Sign in with your new password.
              </Link>
            </Text>
          </AlertDescription></Alert>
      )}

      {error && (
        <Alert status="error" data-testid="recovery-error"><AlertDescription>{error}</AlertDescription></Alert>
      )}
    </Stack>
  );
}
