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
import { Button, Card, CardContent, List, ListItem, ListItemAction, ListItemContent, ListItemDescription, ListItemIcon, ListItemTitle } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useComponents } from "../../hooks/use-components";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { useSwitchActiveOrg } from "../../hooks/use-switch-active-org";
import { getActiveOrgId, setActiveOrgId } from "../../lib/active-org";
import { queryKeys } from "../../lib/query-keys";
import { orgSectionPath } from "../../lib/org-paths";

import { ApiError } from "../../lib/api-client";
import { EmptyState } from "../../components/EmptyState";
import { StatusAlert } from "../../components/StatusAlert";
import { ConfirmModal } from "../../components/ConfirmModal";

export interface MembershipsPageProps {
  loginPath?: string;
  /** Base of the org pages — a row's link opens `${it}/<id>/info`. */
  organizationsPath?: string;
}

export function MembershipsPage({
  loginPath = "/login",
  organizationsPath = "/organizations",
}: MembershipsPageProps): React.ReactElement | null {
  const { OrganizationAvatar } = useComponents();
  const { client, router } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading: sessionLoading } = useSession();
  const switchActiveOrg = useSwitchActiveOrg();
  const [leaving, setLeaving] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const { data: memberships } = useQuery({
    queryKey: queryKeys.memberships,
    queryFn: () => client.listMemberships(),
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
      await client.leaveOrganization(organizationId, selfUserId);
      // Leaving the org a device was targeting clears the target; the
      // switcher self-heals to the first remaining membership.
      if (getActiveOrgId() === organizationId) setActiveOrgId(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      void queryClient.invalidateQueries({ queryKey: queryKeys.memberships });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "something went wrong");
    } finally {
      setLeaving(null);
    }
  };

  const items = memberships ?? [];

  return (
    <Stack dir="col" gap={24} data-testid="memberships-page" className="w-full max-w-2xl">
      <span element="type--body-small" emphasis="quiet">
        The organizations you belong to. Open one to see its info and members, or leave it.
      </span>

      <Card>
        <CardContent>
          <Stack dir="col" gap={16}>
            {items.length === 0 ? (
              <EmptyState
                kind="nothing-yet"
                icon="building"
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
                        <OrganizationAvatar name={membership.organization.name} scale="md" />
                      </ListItemIcon>
                      <ListItemContent>
                        <Stack dir="col" gap={2}>
                          <ListItemTitle>
                            <a
                              href={orgHref(id)}
                              data-testid={`membership-${id}-open`}
                              onClick={(e) => {
                                e.preventDefault();
                                void openOrg(id);
                              }}
                            >
                              {membership.organization.name}
                            </a>
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
        </CardContent>
      </Card>

      <ConfirmModal
        open={leaving !== null}
        onCancel={() => setLeaving(null)}
        onConfirm={() => leaving && void leaveOrg(leaving)}
        title="Leave this organization?"
        description="You lose access to it until someone invites you back."
        confirmLabel="Leave"
        destructive
        cancelTestId="leave-org-cancel"
        confirmTestId="leave-org-confirm"
      />

      {error && (
        <StatusAlert status="error" testId="memberships-error">{error}</StatusAlert>
      )}
    </Stack>
  );
}
