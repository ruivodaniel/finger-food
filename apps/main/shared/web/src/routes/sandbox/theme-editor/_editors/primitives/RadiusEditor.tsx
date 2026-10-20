import type { ThemeRadius } from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import { RADIUS_OPTS } from "../../_core/constants";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { TextField } from "../shared/TextField";

type Props = {
  data: ThemeRadius;
  inherited?: Partial<ThemeRadius>;
  onChange: OnChange;
};

export function RadiusEditor({ data, inherited, onChange }: Props) {
  return (
    <div className="flex flex-col">
      <Section title="RADIUS">
        {RADIUS_OPTS.map((token) => (
          <Row key={token} label={token}>
            <TextField
              value={data[token]}
              inherited={inherited?.[token]}
              onChange={(v) => onChange([token], v)}
              placeholder="e.g. 4px"
            />
          </Row>
        ))}
      </Section>
    </div>
  );
}
