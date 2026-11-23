/** MeteorPage — /public/meteors/:meteorId: one published meteor, no session needed; 404 otherwise. */

import * as React from "react";
import { Button, Card, Content } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { mounted } from "../../services/application/mount";
import { meteorsService } from "../../services/application/meteors.service";
import { MeteorDetail } from "../../shared/components/MeteorDetail";

export interface MeteorPageProps { meteorId: string; publicPath: string }

export function MeteorPage({ meteorId, publicPath }: MeteorPageProps): React.ReactElement | null {
  const { router } = mounted();
  const { data, isPending, isError } = useQuery(meteorsService.getPublishedMeteor(meteorId));
  if (isPending) return null;
  if (isError || !data) return <span element="type--body-small" data-testid="meteor-not-found">This meteor is not available.</span>;
  return (
    <Stack dir="col" scale="lg" data-testid="meteor-page" className="w-full max-w-2xl">
      <Button buttonType="icon-text" startIcon="arrowLeft" emphasis="secondary" scale="sm" onClick={() => void router?.navigate({ to: publicPath })}>All meteors</Button>
      <Card><Content><MeteorDetail meteor={data} /></Content></Card>
    </Stack>
  );
}
