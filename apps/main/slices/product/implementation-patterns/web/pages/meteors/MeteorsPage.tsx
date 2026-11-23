/** MeteorsPage — /public/meteors: every published meteor, no session needed. */

import * as React from "react";
import { Card, Content } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { mounted } from "../../services/application/mount";
import { meteorsService } from "../../services/application/meteors.service";
import { ListPagination } from "@libs/list-query/client";
import { MeteorList } from "../../shared/components/MeteorList";

const PAGE_SIZE = 20;

export interface MeteorsPageProps { page: number; search: string; publicPath: string }

export function MeteorsPage({ page, search, publicPath }: MeteorsPageProps): React.ReactElement | null {
  const { router } = mounted();
  const { data, isPending, isError } = useQuery(meteorsService.getPublishedMeteors({ page, pageSize: PAGE_SIZE, search: search || undefined }));
  if (isPending) return null;
  if (isError) return <span element="type--body-small">Meteors are not available right now.</span>;
  return (
    <Stack dir="col" scale="xl" data-testid="meteors-page" className="w-full max-w-4xl">
      <Card><Content>
        <Stack dir="col" scale="lg">
          <MeteorList rows={data.rows} emptyText="No published meteors yet." onOpen={(id) => void router?.navigate({ to: `${publicPath}/${id}` })} />
          <ListPagination query={{ page, pageSize: PAGE_SIZE }} total={data.total} onPageChange={(next) => void router?.navigate({ to: `${publicPath}?page=${next}` })} />
        </Stack>
      </Content></Card>
    </Stack>
  );
}
