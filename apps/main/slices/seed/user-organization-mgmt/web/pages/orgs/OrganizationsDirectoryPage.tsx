/**
 * OrganizationsDirectoryPage — the platform's organizations as a managed
 * table: filter bar (status / search / type), paginated rows, and founding
 * a new organization from the toolbar (Sheet). Rows the caller belongs to
 * carry an enter action that OPENS the org (navigates to its info page) —
 * it never activates it; the sidebar OrgSwitcher is the one activation
 * path.
 *
 * The title is the page frame's header band; inside, an intro line, then one
 * Card holding the toolbar (the filter on the left, Create organization on
 * the right), the table and the pagination; the Sheet stays outside it.
 * Layout is Stack; no inline styles.
 *
 * AC(availability-check): organization.read — ROWS; the table shows whatever
 * the directory returns. Row-scoping arrives server-side with the engine;
 * what this page lists follows from the same rules.
 */

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ListPagination } from "@libs/list-query/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import { orgSectionPath } from "../../lib/org-paths";
import { CreateOrganizationForm } from "../../components/orgs/CreateOrganizationForm";
import {
  OrganizationsFilter,
  type OrganizationsFilterValue,
} from "../../components/orgs/OrganizationsFilter";
import { OrganizationsTable } from "../../components/orgs/OrganizationsTable";

const PAGE_SIZE = 20;

export interface OrganizationsDirectoryPageProps {
  loginPath?: string;
  /** Base of the org pages — entering a row opens `${it}/<id>/info`. */
  organizationsPath?: string;
}

export function OrganizationsDirectoryPage({
  loginPath = "/login",
  organizationsPath = "/organizations",
}: OrganizationsDirectoryPageProps): React.ReactElement | null {
  const { client, router } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading: sessionLoading } = useSession();
  const [filter, setFilter] = React.useState<OrganizationsFilterValue>({
    search: "",
    type: null,
    status: "all",
  });
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  const query = {
    search: filter.search || undefined,
    type: filter.type ?? undefined,
    status: filter.status === "all" ? undefined : filter.status,
    page,
    pageSize: PAGE_SIZE,
  };
  const { data: directory } = useQuery({
    queryKey: queryKeys.organizationsDirectory(query),
    queryFn: () => client.listOrganizationsDirectory(query),
    enabled: !!sessionData?.session,
  });
  const { data: orgTypes } = useQuery({
    queryKey: queryKeys.organizationTypes,
    queryFn: () => client.getOrganizationTypes(),
    enabled: !!sessionData?.session,
  });
  const { data: creatableTypes } = useQuery({
    queryKey: queryKeys.creatableOrgTypes,
    queryFn: () => client.getCreatableOrganizationTypes(),
    enabled: !!sessionData?.session,
  });

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  const memberOrgIds = new Set(
    sessionData.session.memberships.map((m) => m.organizationId),
  );

  // Open ≠ activate: entering just navigates to the org's pages (spelled
  // `current` when it happens to be the active org). Activation stays the
  // OrgSwitcher's job.
  const activeOrgId = sessionData.session.activeOrganizationId ?? null;
  const enterOrg = async (organizationId: string) => {
    await router?.navigate({
      to: orgSectionPath(organizationsPath, organizationId, activeOrgId, "info"),
    });
  };

  return (
    <Stack
      dir="col"
      gap={24}
      data-testid="organizations-directory-page"
      className="w-full max-w-4xl"
    >
      <span element="type--body-small" emphasis="quiet">
        Every organization on the platform. You can open the ones you belong to.
      </span>

      <Card>
        <CardContent>
          <Stack dir="col" gap={16}>
            <Stack dir="row" align="center" justify="between" gap={12}>
              <OrganizationsFilter
                value={filter}
                types={orgTypes ?? []}
                onChange={(next) => {
                  setFilter(next);
                  setPage(1);
                }}
              />
              {creatableTypes && creatableTypes.length > 0 && (
                <Button
                  data-testid="org-create-btn"
                  buttonType="icon-text"
                  startIcon="add"
                  onClick={() => setCreateOpen(true)}
                >
                  Create organization
                </Button>
              )}
            </Stack>

            <OrganizationsTable
              rows={directory?.rows ?? []}
              memberOrgIds={memberOrgIds}
              onEnter={(id) => void enterOrg(id)}
            />

            <ListPagination
              query={{ page, pageSize: PAGE_SIZE }}
              total={directory?.total ?? 0}
              onPageChange={setPage}
            />
          </Stack>
        </CardContent>
      </Card>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create an organization</SheetTitle>
            <SheetDescription>Pick its type and give it a name.</SheetDescription>
          </SheetHeader>
          <CreateOrganizationForm
            types={creatableTypes ?? []}
            onCreated={() => {
              // Founding an org does NOT activate it — the switcher decides
              // what the device targets. Refresh what changed: the caller's
              // memberships (session + list) and the directory rows.
              setCreateOpen(false);
              void queryClient.invalidateQueries({
                queryKey: queryKeys.session,
              });
              void queryClient.invalidateQueries({
                queryKey: queryKeys.memberships,
              });
              void queryClient.invalidateQueries({
                queryKey: ["uom", "organizations-directory"],
              });
            }}
          />
        </SheetContent>
      </Sheet>
    </Stack>
  );
}
