/**
 * TwoFactorCard — the TOTP machine as one shared unit: enrolled (status
 * + optional regenerate/disable; an AAL1 session also gets "verify this
 * session" — the resolve path for the gate's factor_session_verified demand)
 * or not (enable → enroll → backup codes). Disabling needs an AAL2 step-up
 * first, driven inline.
 *
 * Mounted by the security settings page (with `showManagement`) and by the
 * /resolve wizard (bare). Confirming enrolment or stepping up invalidates
 * session+gate, so an outstanding obligation clears in place. `children`
 * render only while idle — extra page sections stay hidden mid-flow.
 */

import * as React from "react";
import { Button, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TotpEnrollCard } from "./TotpEnrollCard";
import { BackupCodesCard } from "./BackupCodesCard";
import { StepUpForm } from "./StepUpForm";
import { authenticationService } from "../../services/application/authentication.service";
import { securityService } from "../../services/application/security.service";
import { onboardingService } from "../../services/application/onboarding.service";
import { isApiError } from "../helpers/api-error";

export interface TwoFactorCardProps {
  /** Show the enrolled-state management row (regenerate / turn off). */
  showManagement?: boolean;
  /** Rendered only while idle — page sections that hide mid-flow. */
  children?: React.ReactNode;
}

type Mode =
  | "idle"
  | "enrolling"
  | "showingCodes"
  | "steppingUpToVerify"
  | "steppingUpToDisable";

export function TwoFactorCard({
  showManagement = false,
  children,
}: TwoFactorCardProps): React.ReactElement | null {
  const queryClient = useQueryClient();
  const { data: sessionData } = useQuery(authenticationService.getSession());

  const [mode, setMode] = React.useState<Mode>("idle");
  const [codes, setCodes] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const { data: status } = useQuery({
    ...securityService.getStatus(),
    enabled: !!sessionData?.session,
  });

  if (!sessionData?.session) return null;

  const refreshStatus = () =>
    queryClient.invalidateQueries({ queryKey: securityService.keys.security });

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(isApiError(e) ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const regenerate = () =>
    run(async () => {
      const { backupCodes } = await securityService.regenerateBackupCodes();
      setCodes(backupCodes);
      setMode("showingCodes");
    });

  const disable = () =>
    run(async () => {
      await securityService.disableTotp();
      await refreshStatus();
      setMode("idle");
    });

  return (
    <Stack dir="col" scale="xl" data-testid="two-factor-resolution">
      {mode === "enrolling" && (
        <TotpEnrollCard
          onEnrolled={(backupCodes) => {
            setCodes(backupCodes);
            setMode("showingCodes");
            void refreshStatus();
            // Confirming enrolment proves the authenticator on THIS session —
            // the provider raises it to AAL2 — so the cached session (and the
            // gate riding on it) must refetch or a stale "verify this
            // session" prompt appears for a session that is already verified.
            void queryClient.invalidateQueries({ queryKey: authenticationService.keys.session });
            void queryClient.invalidateQueries({ queryKey: onboardingService.keys.gate });
          }}
          onCancel={() => setMode("idle")}
        />
      )}

      {mode === "showingCodes" && (
        <BackupCodesCard
          codes={codes}
          onDone={() => {
            setCodes([]);
            setMode("idle");
          }}
        />
      )}

      {mode === "steppingUpToDisable" && (
        <StepUpForm
          onStepUp={() => disable()}
          onCancel={() => setMode("idle")}
        />
      )}

      {mode === "steppingUpToVerify" && (
        <StepUpForm
          onStepUp={async () => {
            await queryClient.invalidateQueries({
              queryKey: authenticationService.keys.session,
            });
            await queryClient.invalidateQueries({ queryKey: onboardingService.keys.gate });
            setMode("idle");
          }}
          onCancel={() => setMode("idle")}
        />
      )}

      {mode === "idle" &&
        status?.totpEnrolled &&
        sessionData.session.aal !== "aal2" && (
          <Stack dir="col" scale="md">
            <Text as="h2" type="heading4">Verify this session</Text>
            <Text as="p" type="body-small" data-testid="security-2fa-unverified">
              This session hasn't been verified with your authenticator yet —
              protected areas stay locked until it is.
            </Text>
            <Stack dir="row">
              <Button
                data-testid="security-step-up"
                onClick={() => setMode("steppingUpToVerify")}
              >
                Verify this session
              </Button>
            </Stack>
          </Stack>
        )}

      {mode === "idle" && status?.totpEnrolled && (
        <Stack dir="col" scale="md">
          <Text as="h2" type="heading4">Two-factor authentication</Text>
          <Text as="p" type="body-small" data-testid="security-2fa-on">
            Two-factor authentication is <Text as="strong">on</Text>. Protected areas
            ask each session for a code from your authenticator app.
          </Text>
          {showManagement && (
            <Stack dir="row" scale="sm">
              <Button
                data-testid="security-regenerate"
                emphasis="secondary"
                onClick={regenerate}
                disabled={busy}
              >
                Regenerate backup codes
              </Button>
              <Button
                data-testid="security-disable"
                emphasis="secondary"
                status="destructive"
                onClick={() => setMode("steppingUpToDisable")}
                disabled={busy}
              >
                Turn off
              </Button>
            </Stack>
          )}
        </Stack>
      )}

      {mode === "idle" && !status?.totpEnrolled && (
        <Stack dir="col" scale="md">
          <Text as="h2" type="heading4">Two-factor authentication</Text>
          <Text as="p" type="body-small" data-testid="security-2fa-off">
            Add an extra layer of protection: after your password, we ask for
            a code from an app on your phone.
          </Text>
          <Stack dir="row">
            <Button
              data-testid="security-enable"
              onClick={() => setMode("enrolling")}
            >
              Turn on two-factor authentication
            </Button>
          </Stack>
        </Stack>
      )}

      {mode === "idle" && children}

      {error && (
        <Text as="p" type="body-small" data-testid="security-error" role="alert">
          {error}
        </Text>
      )}
    </Stack>
  );
}
