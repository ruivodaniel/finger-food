/**
 * MembershipsPage — the caller's memberships: open or LEAVE each. Founding
 * an org lives on the directory page; pending invitations live on their own
 * page. Requires a session.
 *
 * The title is the page frame's header band; inside, an intro line, then one
 * Card holding a List — each membership a row: the org's monogram · its name
 * (the link) over type · roles · Leave as the row action. EmptyState when
 * there are none; errors as an Alert. Layout is Stack; no inline styles.
 *
 * Opening a membership that is NOT the active org switches to it first: the
 * server answers from the active org's context, so its pages would otherwise
 * be out of reach.
 */

import * as React from "react";
import { Button, Card, Content, List, ListItem, ListItemAction, ListItemContent, ListItemDescription, ListItemIcon, ListItemTitle, Alert, AlertDescription, EmptyState, Icon, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, Footer, Header, AlertDialogTitle, Avatar, AvatarFallback, Text, Link } from "@libs/web-components";
import { initialsOf } from "../../shared/helpers/initials";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { orgSectionPath } from "../../shared/helpers/org-paths";

import { authenticationService } from "../../services/application/authentication.service";
import { membershipsService } from "../../services/application/memberships.service";
import { mounted } from "../../services/application/mount";
import { isApiError } from "../../shared/helpers/api-error";
import { clearActiveOrg, getActiveOrgId } from "../../store/active-organization.store";

export interface MembershipsPageProps {
  loginPath?: string;
  /** Base of the org pages — a row's link opens `${it}/<id>/info`. */
  organizationsPath?: string;
}

export function MembershipsPage({
  loginPath = "/login",
  organizationsPath = "/organizations",
}: MembershipsPageProps): React.ReactElement | null {
  const { router } = mounted();
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading: sessionLoading } = useQuery(authenticationService.getSession());
  const switchActiveOrg = membershipsService.switchActiveOrg;
  const [leaving, setLeaving] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const { data: memberships } = useQuery({
    ...membershipsService.listMyMemberships(),
    enabled: !!sessionData?.session,
  });

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;
  const selfUserId = sessionData.user?.id;
  const activeOrgId = sessionData.session.activeOrganizationId ?? null;

  // The link names the org's pages (`current` for the active org, the id for
  // any other). Opening another membership makes it the active org first —
  // once the session carries it, its pages answer from its context — and
  // lands on them as `current`.
  const orgHref = (organizationId: string) =>
    orgSectionPath(organizationsPath, organizationId, activeOrgId, "info");
  const openOrg = async (organizationId: string) => {
    if (organizationId !== activeOrgId) await switchActiveOrg(organizationId);
    await router?.navigate({
      to: orgSectionPath(organizationsPath, organizationId, organizationId, "info"),
    });
  };

  const leaveOrg = async (organizationId: string) => {
    if (!selfUserId) return;
    setError(null);
    try {
      await membershipsService.leaveOrganization(organizationId, selfUserId);
      // Leaving the org a device was targeting clears the target; the
      // switcher self-heals to the first remaining membership.
      if (getActiveOrgId() === organizationId) clearActiveOrg();
      await queryClient.invalidateQueries({ queryKey: authenticationService.keys.session });
      void queryClient.invalidateQueries({ queryKey: membershipsService.keys.memberships });
    } catch (e) {
      setError(isApiError(e) ? e.message : "something went wrong");
    } finally {
      setLeaving(null);
    }
  };

  const items = memberships ?? [];

  return (
    <Stack dir="col" scale="xl" data-testid="memberships-page">
      <Text type="body-small" emphasis="quiet">
        The organizations you belong to. Open one to see its info and members, or leave it.
      </Text>

      <Card>
        <Content>
          <Stack dir="col" scale="lg">
            {items.length === 0 ? (
              <EmptyState emphasis="quiet"
                icon={<Icon name="building" />}
                title="No memberships yet"
                description="Accept an invitation, or found an organization from the directory."
              />
            ) : (
              <List data-testid="memberships-list" position="fill">
                {items.map((membership) => {
                  const id = membership.organization.id;
                  return (
                    <ListItem key={id} data-testid={`membership-${id}`}>
                      <ListItemIcon>
                        <Avatar scale="md">
                          <AvatarFallback>{initialsOf(membership.organization.name)}</AvatarFallback>
                        </Avatar>
                      </ListItemIcon>
                      <ListItemContent>
                        <Stack dir="col" scale="3xs">
                          <ListItemTitle>
                            <Link
                              href={orgHref(id)}
                              data-testid={`membership-${id}-open`}
                              onClick={(e) => {
                                e.preventDefault();
                                void openOrg(id);
                              }}
                            >
                              {membership.organization.name}
                            </Link>
                          </ListItemTitle>
                          <ListItemDescription>
                            {membership.organization.typeLabel} · {membership.roles.join(", ")}
                          </ListItemDescription>
                        </Stack>
                      </ListItemContent>
                      <ListItemAction>
                        <Button
                          data-testid={`membership-${id}-leave`}
                          emphasis="secondary"
                          status="destructive"
                          scale="sm"
                          onClick={() => setLeaving(id)}
                        >
                          Leave
                        </Button>
                      </ListItemAction>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Stack>
        </Content>
      </Card>

      <AlertDialog open={leaving !== null} onOpenChange={(next) => !next && setLeaving(null)}>
        <AlertDialogContent status="destructive">
          <Header>
            <AlertDialogTitle>Leave this organization?</AlertDialogTitle>
            <AlertDialogDescription>You lose access to it until someone invites you back.</AlertDialogDescription>
          </Header>
          <Footer>
            <AlertDialogCancel data-testid="leave-org-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="leave-org-confirm"
              status="destructive"
              onClick={() => leaving && void leaveOrg(leaving)}
            >
              Leave
            </AlertDialogAction>
          </Footer>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <Alert status="error" data-testid="memberships-error"><AlertDescription>{error}</AlertDescription></Alert>
      )}
    </Stack>
  );
}
