import type { ThemeTypography } from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import { FONT_FAMILY_TOKEN_OPTS, TYPO_OPTS } from "../../_core/constants";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { TextField } from "../shared/TextField";
import { TypographyLevelEditor } from "./TypographyLevelEditor";

type Props = {
  data: ThemeTypography;
  inherited?: Partial<ThemeTypography>;
  onChange: OnChange;
};

export function TypographyEditor({ data, inherited, onChange }: Props) {
  return (
    <div className="flex flex-col">
      <Section title="FONT FAMILIES">
        {FONT_FAMILY_TOKEN_OPTS.map((token) => (
          <Row key={token} label={token}>
            <TextField
              value={data.fonts?.[token]}
              inherited={inherited?.fonts?.[token]}
              onChange={(v) => onChange(["fonts", token], v)}
              placeholder="Font name"
            />
          </Row>
        ))}
      </Section>

      <Section title="TYPE LEVELS">
        {TYPO_OPTS.map((key) => {
          const levelData = data.types?.[key];
          const levelInherited = inherited?.types?.[key];
          if (!levelData) return null;
          return (
            <TypographyLevelEditor
              key={key}
              label={key}
              data={levelData}
              inherited={levelInherited}
              onChange={(path, value) => onChange(["types", key, ...path], value)}
            />
          );
        })}
      </Section>
    </div>
  );
}
