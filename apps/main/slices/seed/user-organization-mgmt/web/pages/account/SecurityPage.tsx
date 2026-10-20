/**
 * SecurityPage — two-factor authentication management plus device hygiene.
 * Requires a session (redirects otherwise). The TOTP machine itself lives in
 * TwoFactorCard (shared with the /resolve wizard); this page mounts it
 * with management enabled and adds the signed-in-devices section.
 *
 * The "Settings" title is the settings frame's; inside, the section heading
 * block (Security over a quiet line), then one Card holding the two-factor
 * unit with the signed-in devices block as its child (TwoFactorCard
 * renders children only while idle, so the block hides mid-flow), then the
 * Profile link. The devices error is an Alert. Layout is Stack; no inline
 * styles.
 */

import * as React from "react";
import { Button, Card, CardContent } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { ApiError } from "../../lib/api-client";
import { TwoFactorCard } from "../../components/security/TwoFactorCard";
import { StatusAlert } from "../../components/StatusAlert";

export interface SecurityPageProps {
  loginPath?: string;
  profilePath?: string;
}

export function SecurityPage({
  loginPath = "/login",
  profilePath = "/my/settings/profile",
}: SecurityPageProps): React.ReactElement | null {
  const { client, router } = useUserOrgMgmtContext();
  const { data: sessionData, isLoading: sessionLoading } = useSession();

  const [signedOutOthers, setSignedOutOthers] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  const signOutOthers = async () => {
    setBusy(true);
    setError(null);
    try {
      await client.revokeOtherSessions();
      setSignedOutOthers(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack dir="col" gap={24} data-testid="security-page" className="w-full max-w-2xl">
      <Stack dir="col" gap={4}>
        <h2 element="type--heading3">Security</h2>
        <span element="type--body-small" emphasis="quiet">
          Two-factor authentication for your account, and the devices signed in to it.
        </span>
      </Stack>

      <Card>
        <CardContent>
          <TwoFactorCard showManagement>
            <Stack dir="col" gap={12}>
              <h2 element="type--heading4">Signed-in devices</h2>
              {signedOutOthers ? (
                <span
                  element="type--body-small"
                  status="success"
                  data-testid="security-signed-out-others"
                >
                  Done — every other device has been signed out.
                </span>
              ) : (
                <>
                  <span element="type--body-small">
                    See something you don't recognize? Sign out everywhere else — this
                    device stays signed in.
                  </span>
                  <Stack dir="row" gap={8}>
                    <Button
                      data-testid="security-sign-out-others"
                      emphasis="secondary"
                      onClick={() => void signOutOthers()}
                      disabled={busy}
                    >
                      Sign out of all other devices
                    </Button>
                  </Stack>
                </>
              )}
              {error && (
                <StatusAlert status="error" testId="security-devices-error">{error}</StatusAlert>
              )}
            </Stack>
          </TwoFactorCard>
        </CardContent>
      </Card>

      <span element="type--body-small">
        <a
          element="type--link"
          href={profilePath}
          onClick={(e) => {
            e.preventDefault();
            void router?.navigate({ to: profilePath });
          }}
        >
          Profile →
        </a>
      </span>
    </Stack>
  );
}
