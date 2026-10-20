/**
 * ResolvePage — the destination a gated caller is bounced to, and the ONLY
 * page exempt from the app's gate guard (the guard self-exempts by pathname,
 * so this page can't trap the caller in a redirect loop). A wizard: exactly
 * one obligation resolves at a time, in the gate's fixed order — the mounted
 * resolver satisfies it in place and invalidates the gate query, which
 * advances the wizard. Once everything is met it offers the way back to the
 * blocked page (?intention=).
 *
 * The title is the page frame's header band; inside, an intro line, then —
 * while blocked — the progress list over the current obligation's resolver;
 * once clear, a success Card with Continue. Layout is Stack; no inline
 * styles.
 */

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Icon,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import {
  navigateToPath,
  sanitizeInAppPath,
} from "../../lib/navigate-to-path";
import { ObligationProgressList } from "../../components/resolve/ObligationProgressList";
import { ObligationResolver } from "../../components/resolve/ObligationResolver";

export interface ResolvePageProps {
  loginPath?: string;
  /** Where "Continue" lands once the caller is clear. */
  homePath?: string;
  /** The page the caller was blocked from (guard-set) — Continue returns there. */
  intention?: string;
}

export function ResolvePage({
  loginPath = "/login",
  homePath = "/",
  intention,
}: ResolvePageProps): React.ReactElement | null {
  const { client, router } = useUserOrgMgmtContext();
  const { data: sessionData, isLoading: sessionLoading } = useSession();

  const { data: gate } = useQuery({
    queryKey: queryKeys.gate,
    queryFn: () => client.gateCheck(),
    enabled: !!sessionData?.session,
    // Always current when the caller lands here after resolving something.
    refetchOnMount: "always",
  });

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  const obligations =
    gate && "obligations" in gate ? gate.obligations : undefined;
  const blocked = !!obligations && obligations.length > 0;

  return (
    <Stack dir="col" gap={24} data-testid="resolve-page" className="w-full max-w-2xl">
      <span element="type--body-small" emphasis="quiet">
        {blocked
          ? "A few things are needed before you can continue — one step at a time."
          : "Nothing more is needed before you continue."}
      </span>

      {blocked ? (
        <>
          <ObligationProgressList obligations={obligations} />
          <ObligationResolver obligation={obligations[0]} loginPath={loginPath} />
        </>
      ) : (
        <Card data-testid="resolve-clear" position="fill">
          <CardHeader status="success">
            <Stack dir="row" align="center" gap={8}>
              <Icon name="success" size="sm" />
              <h2 element="type--heading4">You're all set</h2>
            </Stack>
          </CardHeader>
          <CardContent>
            <span element="type--body">Your account meets everything that was required.</span>
          </CardContent>
          <CardFooter position="fill">
            <Stack dir="row" justify="end" gap={8} className="w-full">
              <Button
                data-testid="resolve-continue"
                onClick={() =>
                  void navigateToPath(router, sanitizeInAppPath(intention) ?? homePath)
                }
              >
                Continue
              </Button>
            </Stack>
          </CardFooter>
        </Card>
      )}
    </Stack>
  );
}
