/** LocksPage — /locks: the locks the caller may see. A company's members see their company's; a system admin sees every
 * company's. Each row offers Unlock where the server says the caller may. */
import * as React from "react";
import { Card, Content } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ListPagination } from "@libs/list-query/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { locksService } from "../../services/application/locks.service";
import { mountedApp } from "../../services/application/mount";
import type { DocumentLockRow } from "../../../shared/types";
import { LocksTable } from "./components/LocksTable";

const PAGE_SIZE = 20;

export interface LocksPageProps { page: number; locksPath: string }

export function LocksPage({ page, locksPath }: LocksPageProps): React.ReactElement | null {
  const { data, isPending, isError } = useQuery(locksService.getLocks({ page, pageSize: PAGE_SIZE }));
  const unlock = useMutation({
    mutationFn: (row: DocumentLockRow) => locksService.unlock(row.kind, row.documentId),
  });
  if (isPending) return null;
  if (isError) return <span element="type--body-small">The locks are not available right now.</span>;
  return (
    <Stack dir="col" scale="xl" data-testid="locks-page" className="w-full max-w-4xl">
      <Card><Content>
        <Stack dir="col" scale="lg">
          <LocksTable rows={data.rows} unlocking={unlock.isPending ? unlock.variables?.id ?? null : null} onUnlock={(row) => unlock.mutate(row)} />
          <ListPagination query={{ page, pageSize: PAGE_SIZE }} total={data.total} onPageChange={(next) => mountedApp().navigate?.(`${locksPath}?page=${next}`)} />
        </Stack>
      </Content></Card>
    </Stack>
  );
}
