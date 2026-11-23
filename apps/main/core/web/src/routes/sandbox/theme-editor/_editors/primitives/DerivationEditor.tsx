import type { ThemeColorsDerivation } from "@libs/ui-types";
import type { OnChange } from "../../_core/types";
import { Row } from "../shared/Row";
import { NumberField } from "../shared/NumberField";
import { TextField } from "../shared/TextField";

type Props = {
  data: ThemeColorsDerivation;
  inherited?: Partial<ThemeColorsDerivation>;
  onChange: OnChange;
};

export function DerivationEditor({ data, inherited, onChange }: Props) {
  return (
    <div className="flex flex-col pl-2">
      <Row label="grayMix">
        <TextField
          value={data.grayColorMixPercentage}
          inherited={inherited?.grayColorMixPercentage}
          onChange={(v) => onChange(["grayColorMixPercentage"], v)}
          placeholder="e.g. 5%"
        />
      </Row>
    </div>
  );
}
