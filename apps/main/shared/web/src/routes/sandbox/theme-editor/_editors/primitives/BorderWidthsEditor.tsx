import type { ThemeBorderWidths } from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import { BORDER_WIDTH_OPTS } from "../../_core/constants";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { TextField } from "../shared/TextField";

type Props = {
  data: ThemeBorderWidths;
  inherited?: Partial<ThemeBorderWidths>;
  onChange: OnChange;
};

export function BorderWidthsEditor({ data, inherited, onChange }: Props) {
  return (
    <div className="flex flex-col">
      <Section title="BORDER WIDTHS">
        {BORDER_WIDTH_OPTS.map((token) => (
          <Row key={token} label={token}>
            <TextField
              value={data[token]}
              inherited={inherited?.[token]}
              onChange={(v) => onChange([token], v)}
              placeholder="e.g. 1px"
            />
          </Row>
        ))}
      </Section>
    </div>
  );
}
