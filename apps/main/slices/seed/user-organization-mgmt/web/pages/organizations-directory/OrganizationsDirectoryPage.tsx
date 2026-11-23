/**
 * OrganizationsDirectoryPage — the platform's organizations as a managed
 * table: filter bar (status / search / type), paginated rows, and founding
 * a new organization from the toolbar (Sheet). Every row carries an enter
 * action that OPENS the org (navigates to its info page) — it never
 * activates it; the sidebar OrgSwitcher is the one activation path.
 *
 * The title is the page frame's header band; inside, an intro line, then one
 * Card holding the toolbar (the filter on the left, Create organization on
 * the right), the table and the pagination; the Sheet stays outside it.
 * Layout is Stack; no inline styles.
 *
 * AC(availability-check): organization.read — ROWS; the table shows whatever
 * the directory returns, row-scoped server-side by the active org's grants.
 * A listed org is therefore one those grants can read, so each row opens.
 */

import * as React from "react";
import { Button, Card, Content, Sheet, SheetContent, SheetDescription, Header, SheetTitle, Text, SheetClose } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ListPagination } from "@libs/list-query/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { orgSectionPath } from "../../shared/helpers/org-paths";
import { CreateOrganizationForm } from "./components/CreateOrganizationForm";
import { OrganizationsFilter, type OrganizationsFilterValue } from "./components/OrganizationsFilter";
import { OrganizationsTable } from "./components/OrganizationsTable";
import { authenticationService } from "../../services/application/authentication.service";
import { organizationsService } from "../../services/application/organizations.service";
import { membershipsService } from "../../services/application/memberships.service";
import { mounted } from "../../services/application/mount";

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
  const { router } = mounted();
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading: sessionLoading } = useQuery(authenticationService.getSession());
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
    ...organizationsService.listOrganizations(query),
    enabled: !!sessionData?.session,
  });
  const { data: orgTypes } = useQuery({
    ...organizationsService.getOrganizationTypes(),
    enabled: !!sessionData?.session,
  });
  const { data: creatableTypes } = useQuery({
    ...organizationsService.getCreatableTypes(),
    enabled: !!sessionData?.session,
  });

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

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
      dir="col" scale="xl"
      data-testid="organizations-directory-page"
    >
      <Text type="body-small" emphasis="quiet">
        The organizations your active organization can see. Open one to view its details and
        members.
      </Text>

      <Card>
        <Content>
          <Stack dir="col" scale="lg">
            <OrganizationsFilter
              value={filter}
              types={orgTypes ?? []}
              onChange={(next) => {
                setFilter(next);
                setPage(1);
              }}
              actions={
                creatableTypes && creatableTypes.length > 0 ? (
                  <Button
                    data-testid="org-create-btn"
                    buttonType="icon-text"
                    startIcon="add"
                    onClick={() => setCreateOpen(true)}
                  >
                    Create organization
                  </Button>
                ) : null
              }
            />

            <OrganizationsTable
              rows={directory?.rows ?? []}
              onEnter={(id) => void enterOrg(id)}
            />

            <ListPagination
              query={{ page, pageSize: PAGE_SIZE }}
              total={directory?.total ?? 0}
              onPageChange={setPage}
            />
          </Stack>
        </Content>
      </Card>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <Header><Stack dir="row" align="center" justify="between"><Stack dir="col" scale="2xs"><SheetTitle>Create an organization</SheetTitle>
            <SheetDescription>Pick its type and give it a name.</SheetDescription></Stack><SheetClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="create-org-sheet-close-btn" /></SheetClose></Stack></Header>
          <CreateOrganizationForm
            types={creatableTypes ?? []}
            onCreated={() => {
              // Founding an org does NOT activate it — the switcher decides
              // what the device targets. Refresh what changed: the caller's
              // memberships (session + list) and the directory rows.
              setCreateOpen(false);
              void queryClient.invalidateQueries({
                queryKey: authenticationService.keys.session,
              });
              void queryClient.invalidateQueries({
                queryKey: membershipsService.keys.memberships,
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
