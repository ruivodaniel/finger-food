import { NotFound } from "@modules/shared/web";
import { authenticationService, useResetOnIdentityChange } from "@modules/user-organization-mgmt/web";
import { Brand } from "@configs/brand";
import { useQuery } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { coreRealtime } from "@/config/realtime.config";

export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: Brand.appName }],
  }),
  notFoundComponent: NotFound,
  component: RootComponent,
});

function RootComponent() {
  // When the signed-in user changes, forget what was cached for the previous one.
  useResetOnIdentityChange();
  useSignedInRealtime();

  return (
    <>
      <HeadContent />
      <Outlet />
    </>
  );
}

/** The API's real-time stream (one per tab), open while a user is signed in: a new one for each user. */
function useSignedInRealtime(): void {
  const { data } = useQuery(authenticationService.getSession());
  const userId = data?.session ? (data.user?.id ?? null) : null;
  useEffect(() => {
    if (!userId) return;
    coreRealtime.open();
    return coreRealtime.close;
  }, [userId]);
}
