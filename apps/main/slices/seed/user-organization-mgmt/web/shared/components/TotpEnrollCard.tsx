/**
 * TotpEnrollCard — scan the QR (or type the secret) into an authenticator,
 * then confirm with the first code. On success the parent receives the
 * one-time backup codes to display.
 *
 * A 403 on confirm means the session is too old for a credential change
 * (the provider's privileged-session window), not a wrong code — the card
 * then offers a fresh sign-in that returns to the current page.
 */

import * as React from "react";
import { Button, Input, RemoteImage, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { authenticationService } from "../../services/application/authentication.service";
import { securityService } from "../../services/application/security.service";
import { mounted } from "../../services/application/mount";
import { isApiError } from "../helpers/api-error";

export interface TotpEnrollCardProps {
  onEnrolled: (backupCodes: string[]) => void;
  onCancel: () => void;
}

export function TotpEnrollCard({
  onEnrolled,
  onCancel,
}: TotpEnrollCardProps): React.ReactElement {
  const { router } = mounted();
  const [enrollment, setEnrollment] = React.useState<{
    flowId: string;
    totpSecret: string;
    qrDataUrl: string;
  } | null>(null);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const reauth = () => authenticationService.signOut({
    // Back to this page after the fresh sign-in — on /resolve that resumes
    // the wizard (with its original intention still in the URL).
    intention: router?.currentPath?.(),
  });

  // One enrollment per mount: a second call would mint a second provider
  // flow (and secret) behind the QR already on screen — dev StrictMode
  // double-runs effects, so this must be guarded by a ref.
  const startedEnrollment = React.useRef(false);
  React.useEffect(() => {
    if (startedEnrollment.current) return;
    startedEnrollment.current = true;
    securityService
      .startTotp()
      .then(setEnrollment)
      .catch((e: unknown) =>
        setError(isApiError(e) ? e.message : "something went wrong"),
      );
  }, []);

  const confirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!enrollment) return;
    setSubmitting(true);
    setError(null);
    try {
      const { backupCodes } = await securityService.confirmTotp({
        flowId: enrollment.flowId,
        code,
      });
      onEnrolled(backupCodes);
    } catch (e) {
      if (isApiError(e)) {
        setError(e.message);
        // 403 = privileged-session window elapsed; a wrong code is a 400.
        setNeedsReauth(e.status === 403);
      } else {
        setError("something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      data-testid="totp-enroll-card"
      onSubmit={confirm}
    >
      <Stack dir="col" scale="md">
      <Text as="h2" type="heading4">Set up an authenticator app</Text>
      {enrollment ? (
        <>
          <RemoteImage data-testid="totp-qr" src={enrollment.qrDataUrl} alt="TOTP QR code" fit="none" />
          <Text as="p" type="body-small">
            Or enter this key manually:{" "}
            <Text type="code" data-testid="totp-secret">{enrollment.totpSecret}</Text>
          </Text>
          <Input
            data-testid="totp-confirm-input"
            value={code}
            onChange={(value) => setCode(value)}
            placeholder="6-digit code"
            autoFocus
          />
          <Stack dir="row" scale="sm">
            <Button
              data-testid="totp-confirm-submit"
              type="submit"
              disabled={submitting || code.length === 0}
            >
              Confirm
            </Button>
            <Button
              data-testid="totp-enroll-cancel"
              emphasis="secondary"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </Stack>
        </>
      ) : (
        <Text as="p" type="body-small">Preparing…</Text>
      )}
      {error && (
        <Text as="p" type="body-small" data-testid="totp-enroll-error" role="alert">
          {error}
        </Text>
      )}
      {needsReauth && (
        <Stack dir="row">
          <Button
            data-testid="totp-enroll-reauth"
            type="button"
            onClick={() => void reauth()}
          >
            Sign out and sign back in
          </Button>
        </Stack>
      )}
      </Stack>
    </form>
  );
}
