// What a version changed from another: in the presenter's words if it has them, otherwise field by field.
import { Stack } from "@libs/web-layouts";
import type { FieldDelta } from "../../../shared/types";
import { presenterOf } from "./presenters";
import { ValueDiff } from "./ValueDiff";

export function VersionChanges({ entity, changes }: { entity: string; changes: FieldDelta[] | null | undefined }) {
  if (!changes?.length) return null;
  const presenter = presenterOf(entity);
  if (presenter.summarize) return <span element="type--body-small" data-testid="version-changes">{presenter.summarize(changes)}</span>;
  const fields = presenter.fields ?? [];
  return (
    <Stack dir="col" scale="2xs" data-testid="version-changes">
      {changes.map((change) => {
        const field = fields.find((candidate) => candidate.key === change.field);
        return (
          <Stack key={change.field} dir="row" scale="sm" align="start">
            <span element="type--body-extra-small" emphasis="quiet" style={{ minWidth: 72 }}>{field?.label ?? change.field}</span>
            <ValueDiff from={change.from} to={change.to} render={field?.render} />
          </Stack>
        );
      })}
    </Stack>
  );
}
