// Which two versions are being compared: any two, on any branch. The host decides what to do with them.
import { Button, InputSelect, type InputSelectOption } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { VersionView } from "../../../shared/types";
import { formatMoment } from "../helpers/format";

interface VersionComparePickerProps {
  versions: VersionView[];
  fromVersionId: string;
  toVersionId: string;
  onChange: (fromVersionId: string, toVersionId: string) => void;
  onStop: () => void;
}

export function VersionComparePicker({ versions, fromVersionId, toVersionId, onChange, onStop }: VersionComparePickerProps) {
  const options: InputSelectOption[] = [...versions].reverse().map((version) => ({ value: version.versionId, label: `${version.label} · ${version.author.name ?? version.author.id} · ${formatMoment(version.at)}` }));
  return (
    <Stack dir="row" scale="sm" align="center" wrap data-testid="version-comparison">
      <span element="type--body-small" emphasis="quiet">From</span>
      <div style={{ width: 260 }} data-testid="version-compare-from">
        <InputSelect clearable={false} options={options} value={fromVersionId} onChange={(value: string | null) => { if (value) onChange(value, toVersionId); }} />
      </div>
      <span element="type--body-small" emphasis="quiet">To</span>
      <div style={{ width: 260 }} data-testid="version-compare-to">
        <InputSelect clearable={false} options={options} value={toVersionId} onChange={(value: string | null) => { if (value) onChange(fromVersionId, value); }} />
      </div>
      <Button emphasis="tertiary" scale="sm" onClick={onStop} data-testid="version-comparison-stop">Stop comparing</Button>
    </Stack>
  );
}
