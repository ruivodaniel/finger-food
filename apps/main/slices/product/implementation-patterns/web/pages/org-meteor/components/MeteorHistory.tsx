/**
 * MeteorHistory — every version of one meteor, from the versioning slice: the
 * version on show drawn as the meteor's detail, the timeline under it, where a
 * version can be restored, released or compared with another.
 */

import * as React from "react";
import { VersionChanges, VersionedEntity, type View } from "@modules/versioning/web";
import { Stack } from "@libs/web-layouts";
import { MeteorDetail, type MeteorDetailProps } from "../../../shared/components/MeteorDetail";

export interface MeteorHistoryProps {
  meteorId: string;
  /** A restore made a new version: what else shows the meteor reads it again. */
  onRestored: () => void;
}

export function MeteorHistory({ meteorId, onRestored }: MeteorHistoryProps): React.ReactElement {
  const [view, setView] = React.useState<View>({});
  return (
    <VersionedEntity entity="meteor" entityId={meteorId} view={view} onViewChange={setView} onRestored={onRestored}>
      {(row, comparison) => (
        <Stack dir="col" scale="lg">
          <MeteorDetail meteor={row as MeteorDetailProps["meteor"]} />
          {comparison && <VersionChanges entity="meteor" changes={comparison.changes} />}
        </Stack>
      )}
    </VersionedEntity>
  );
}
