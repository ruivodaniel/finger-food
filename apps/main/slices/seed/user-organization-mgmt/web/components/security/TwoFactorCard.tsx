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
import { Button } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import { ApiError } from "../../lib/api-client";
import { TotpEnrollCard } from "./TotpEnrollCard";
import { BackupCodesCard } from "./BackupCodesCard";
import { StepUpForm } from "./StepUpForm";

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
  const { client } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  const { data: sessionData } = useSession();

  const [mode, setMode] = React.useState<Mode>("idle");
  const [codes, setCodes] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const { data: status } = useQuery({
    queryKey: queryKeys.security,
    queryFn: () => client.getSecurityStatus(),
    enabled: !!sessionData?.session,
  });

  if (!sessionData?.session) return null;

  const refreshStatus = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.security });

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const regenerate = () =>
    run(async () => {
      const { backupCodes } = await client.regenerateBackupCodes();
      setCodes(backupCodes);
      setMode("showingCodes");
    });

  const disable = () =>
    run(async () => {
      await client.disableTotp();
      await refreshStatus();
      setMode("idle");
    });

  return (
    <Stack dir="col" gap={24} data-testid="two-factor-resolution">
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
            void queryClient.invalidateQueries({ queryKey: queryKeys.session });
            void queryClient.invalidateQueries({ queryKey: queryKeys.gate });
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
              queryKey: queryKeys.session,
            });
            await queryClient.invalidateQueries({ queryKey: queryKeys.gate });
            setMode("idle");
          }}
          onCancel={() => setMode("idle")}
        />
      )}

      {mode === "idle" &&
        status?.totpEnrolled &&
        sessionData.session.aal !== "aal2" && (
          <Stack dir="col" gap={12}>
            <h2 element="type--heading4">Verify this session</h2>
            <p element="type--body-small" data-testid="security-2fa-unverified">
              This session hasn't been verified with your authenticator yet —
              protected areas stay locked until it is.
            </p>
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
        <Stack dir="col" gap={12}>
          <h2 element="type--heading4">Two-factor authentication</h2>
          <p element="type--body-small" data-testid="security-2fa-on">
            Two-factor authentication is <strong>on</strong>. Protected areas
            ask each session for a code from your authenticator app.
          </p>
          {showManagement && (
            <Stack dir="row" gap={8}>
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
        <Stack dir="col" gap={12}>
          <h2 element="type--heading4">Two-factor authentication</h2>
          <p element="type--body-small" data-testid="security-2fa-off">
            Add an extra layer of protection: after your password, we ask for
            a code from an app on your phone.
          </p>
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
        <p element="type--body-small" data-testid="security-error" role="alert">
          {error}
        </p>
      )}
    </Stack>
  );
}
