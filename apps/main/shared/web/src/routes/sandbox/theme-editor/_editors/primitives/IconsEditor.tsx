import type { ThemeIcons } from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import { ICON_SET_OPTS } from "../../_core/constants";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { TokenDropdown } from "../shared/TokenDropdown";
import { NumberField } from "../shared/NumberField";

type Props = {
  data: ThemeIcons;
  inherited?: Partial<ThemeIcons>;
  onChange: OnChange;
};

const SIZE_KEYS = ["xs", "sm", "md", "lg", "xl"] as const;

export function IconsEditor({ data, inherited, onChange }: Props) {
  return (
    <div className="flex flex-col">
      <Section title="ICONS">
        <Row label="set">
          <TokenDropdown
            value={data.set}
            inherited={inherited?.set}
            onChange={(v) => onChange(["set"], v)}
            options={ICON_SET_OPTS}
          />
        </Row>
        <Row label="weight">
          <NumberField
            value={data.weight}
            inherited={inherited?.weight}
            onChange={(v) => onChange(["weight"], v)}
            min={0.5}
            max={4}
            step={0.5}
          />
        </Row>
      </Section>

      <Section title="SIZES">
        {SIZE_KEYS.map((key) => (
          <Row key={key} label={key}>
            <NumberField
              value={data.sizes?.[key]}
              inherited={inherited?.sizes?.[key]}
              onChange={(v) => onChange(["sizes", key], v)}
              min={8}
              max={64}
            />
          </Row>
        ))}
      </Section>
    </div>
  );
}
