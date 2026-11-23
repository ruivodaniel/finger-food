// A branch of an entity, among its open ones. It shows nothing while main is the only one, unless asked to. The host owns the choice.
import { InputSelect } from "@libs/web-components";
import { useQuery } from "@tanstack/react-query";
import { versioningService } from "../../services/application/versioning.service";

interface BranchPickerProps {
  entity: string;
  entityId: string;
  branch: string;
  onChange: (branch: string) => void;
  /** Shown with a single branch too. */
  alwaysShown?: boolean;
  /** Not on offer: the other side of a merge. */
  excluded?: string;
}

export function BranchPicker({ entity, entityId, branch, onChange, alwaysShown = false, excluded }: BranchPickerProps) {
  const history = useQuery(versioningService.getHistory(entity, entityId));
  const openBranches = history.data?.branches.filter((candidate) => !candidate.archivedAt && candidate.name !== excluded) ?? [];
  if (!alwaysShown && openBranches.length < 2) return null;
  return (
    <div style={{ width: 180 }} data-testid="branch-picker">
      <InputSelect clearable={false} options={openBranches.map(({ name }) => ({ value: name, label: name }))} value={branch} onChange={(value: string | null) => { if (value) onChange(value); }} />
    </div>
  );
}
