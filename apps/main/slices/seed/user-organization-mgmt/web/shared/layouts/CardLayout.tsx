/**
 * CardLayout — the slice layout of the pages that stand in a card, centered, with no navigation: login, registration, recovery,
 * the invitation pages. `redirectSignedInTo` sends a signed-in caller home (login, registration, forgot password); the pages that
 * need the session (reset password, accept an invitation) leave it unset.
 */
import { Outlet } from "@tanstack/react-router";
import { createElement, useEffect, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthPage } from "@libs/web-layouts";
import { Card, Content } from "@libs/web-components";
import { authenticationService } from "../../services/application/authentication.service";
import { mounted } from "../../services/application/mount";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export interface CardLayoutProps {
  redirectSignedInTo?: string;
}

export function CardLayout({ redirectSignedInTo }: CardLayoutProps) {
  const { router } = mounted();
  const { data } = useQuery({ ...authenticationService.getSession(), enabled: !!redirectSignedInTo });
  const signedIn = !!redirectSignedInTo && !!data?.session;
  useEffect(() => {
    if (signedIn) void router?.navigate({ to: redirectSignedInTo! });
  }, [signedIn, redirectSignedInTo, router]);
  if (signedIn) return null;
  return (
    <AuthPage>
      <Card position="stretch">
        <Content>{createElement(RouterOutlet)}</Content>
      </Card>
    </AuthPage>
  );
}
