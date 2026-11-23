/** OrgMeteorNewPage — /meteors/new: add a meteor to the active organization, then go to its detail. */

import * as React from "react";
import { Card, Content } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useMutation } from "@tanstack/react-query";
import { mounted } from "../../services/application/mount";
import { meteorsService } from "../../services/application/meteors.service";
import { isApiError } from "../../shared/helpers/api-error";
import { MeteorForm } from "../../shared/components/MeteorForm";

export interface OrgMeteorNewPageProps { meteorsPath: string }

export function OrgMeteorNewPage({ meteorsPath }: OrgMeteorNewPageProps): React.ReactElement {
  const { router } = mounted();
  const create = useMutation({ mutationFn: meteorsService.create });
  return (
    <Stack dir="col" scale="lg" data-testid="org-meteor-new-page" className="w-full max-w-2xl">
      <h2 element="type--heading3">New meteor</h2>
      <Card><Content>
        <MeteorForm
          submitLabel="Add meteor"
          submitting={create.isPending}
          error={isApiError(create.error) ? create.error.message : null}
          onSubmit={(input) => create.mutate(input, { onSuccess: (row) => void router?.navigate({ to: `${meteorsPath}/${row.id}`, replace: true }) })}
          onCancel={() => void router?.navigate({ to: meteorsPath })}
        />
      </Content></Card>
    </Stack>
  );
}
