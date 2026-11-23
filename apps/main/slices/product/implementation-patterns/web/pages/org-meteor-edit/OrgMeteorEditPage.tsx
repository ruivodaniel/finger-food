/** OrgMeteorEditPage — /meteors/:meteorId/edit: change a meteor live, with whoever else has it open, then go back to its
 * detail. What is typed is stored by the server: Done only leaves. */

import * as React from "react";
import { Button, Card, Content } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { mounted } from "../../services/application/mount";
import { meteorsService } from "../../services/application/meteors.service";
import { LiveMeteorForm } from "./components/LiveMeteorForm";

export interface OrgMeteorEditPageProps { meteorId: string; meteorsPath: string }

export function OrgMeteorEditPage({ meteorId, meteorsPath }: OrgMeteorEditPageProps): React.ReactElement | null {
  const { router } = mounted();
  const { data, isPending, isError } = useQuery(meteorsService.getOrgMeteor(meteorId));
  if (isPending) return null;
  if (isError || !data) return <span element="type--body-small" data-testid="meteor-not-found">This meteor is not available.</span>;
  const done = () => {
    // leaving stores what is pending; the detail reads it again
    void Promise.resolve(router?.navigate({ to: `${meteorsPath}/${meteorId}` })).then(() => meteorsService.refresh());
  };
  return (
    <Stack dir="col" scale="lg" data-testid="org-meteor-edit-page" className="w-full max-w-2xl">
      <Stack dir="row" justify="between" align="center">
        <h2 element="type--heading3">Edit {data.name}</h2>
        <Button data-testid="meteor-done-btn" onClick={done}>Done</Button>
      </Stack>
      <Card><Content><LiveMeteorForm meteorId={meteorId} /></Content></Card>
    </Stack>
  );
}
