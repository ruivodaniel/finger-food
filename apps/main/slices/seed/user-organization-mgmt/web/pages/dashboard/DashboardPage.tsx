/**
 * DashboardPage — the signed-in home: a welcome and, later, whatever the product wants front and center. The slice's page; the
 * destination after sign-in is the application's (its config), so another product may point it elsewhere. Pending obligations
 * never render here: the gate bounces blocked callers to /resolve before this page mounts.
 */
import * as React from "react";
import { Text } from "@libs/web-components";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "@libs/web-layouts";
import { authenticationService } from "../../services/application/authentication.service";

export function DashboardPage(): React.ReactElement | null {
  const { data: sessionData } = useQuery(authenticationService.getSession());
  const name = sessionData?.user?.profile?.name?.trim();
  return (
    <Stack dir="col" scale="lg" data-testid="dashboard-page">
      <Text as="h2" type="heading3">{name ? `Welcome, ${name}` : "Welcome"}</Text>
      <Text as="p" type="body-small">You're all caught up — nothing needs your attention.</Text>
    </Stack>
  );
}
