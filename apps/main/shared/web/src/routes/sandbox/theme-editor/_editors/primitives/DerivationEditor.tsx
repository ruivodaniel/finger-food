import type { ThemeColorsDerivation } from "../../../../../../../../../../shared/libs/ui/types";
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
      <Row label="brndLight">
        <NumberField
          value={data.brandLightAmount}
          inherited={inherited?.brandLightAmount}
          onChange={(v) => onChange(["brandLightAmount"], v)}
          min={0}
          max={100}
        />
      </Row>
      <Row label="brndDark">
        <NumberField
          value={data.brandDarkAmount}
          inherited={inherited?.brandDarkAmount}
          onChange={(v) => onChange(["brandDarkAmount"], v)}
          min={0}
          max={100}
        />
      </Row>
      <Row label="statLight">
        <NumberField
          value={data.statusLightAmount}
          inherited={inherited?.statusLightAmount}
          onChange={(v) => onChange(["statusLightAmount"], v)}
          min={0}
          max={100}
        />
      </Row>
      <Row label="statDark">
        <NumberField
          value={data.statusDarkAmount}
          inherited={inherited?.statusDarkAmount}
          onChange={(v) => onChange(["statusDarkAmount"], v)}
          min={0}
          max={100}
        />
      </Row>
      <Row label="grayMix">
        <TextField
          value={data.grayColorMixPercentage}
          inherited={inherited?.grayColorMixPercentage}
          onChange={(v) => onChange(["grayColorMixPercentage"], v)}
          placeholder="e.g. 5%"
        />
      </Row>
      <Row label="flatSat">
        <NumberField
          value={data.flatSaturationAdjust}
          inherited={inherited?.flatSaturationAdjust}
          onChange={(v) => onChange(["flatSaturationAdjust"], v)}
          min={-100}
          max={100}
        />
      </Row>
    </div>
  );
}
