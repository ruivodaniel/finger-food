import type { ThemeTransitions } from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import { TRANSITION_DURATION_OPTS, TRANSITION_TIMING_OPTS } from "../../_core/constants";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { TextField } from "../shared/TextField";

type Props = {
  data: ThemeTransitions;
  inherited?: Partial<ThemeTransitions>;
  onChange: OnChange;
};

export function TransitionsEditor({ data, inherited, onChange }: Props) {
  return (
    <div className="flex flex-col">
      <Section title="DURATION">
        {TRANSITION_DURATION_OPTS.map((token) => (
          <Row key={token} label={token}>
            <TextField
              value={data.duration?.[token]}
              inherited={inherited?.duration?.[token]}
              onChange={(v) => onChange(["duration", token], v)}
              placeholder="e.g. 200ms"
            />
          </Row>
        ))}
      </Section>

      <Section title="TIMING">
        {TRANSITION_TIMING_OPTS.map((token) => (
          <Row key={token} label={token}>
            <TextField
              value={data.timing?.[token]}
              inherited={inherited?.timing?.[token]}
              onChange={(v) => onChange(["timing", token], v)}
              placeholder="e.g. ease-in-out"
            />
          </Row>
        ))}
      </Section>
    </div>
  );
}
