import type { ThemeColors } from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { ColorField } from "../shared/ColorField";

type Props = {
  data: ThemeColors;
  inherited?: Partial<ThemeColors>;
  onChange: OnChange;
};

const BRAND_SLOTS = ["1", "2", "3", "4"] as const;
const STATUS_KEYS = ["success", "info", "warning", "error"] as const;
const FLAT_KEYS = [
  "red", "orange", "yellow", "lime", "green",
  "mint", "turquoise", "blue", "violet", "purple", "pink",
] as const;
const SEMANTIC_KEYS = ["primary", "secondary", "accent", "muted"] as const;

export function ColorsEditor({ data, inherited, onChange }: Props) {
  return (
    <div className="flex flex-col">
      <Section title="MAIN">
        <Row label="white">
          <ColorField
            value={data.main?.white}
            inherited={inherited?.main?.white}
            onChange={(v) => onChange(["main", "white"], v)}
            mode="hex"
          />
        </Row>
        <Row label="black">
          <ColorField
            value={data.main?.black}
            inherited={inherited?.main?.black}
            onChange={(v) => onChange(["main", "black"], v)}
            mode="hex"
          />
        </Row>
      </Section>

      <Section title="BRAND">
        {BRAND_SLOTS.map((slot) => (
          <Row key={slot} label={`brand-${slot}`}>
            <ColorField
              value={data.brand?.[slot]}
              inherited={inherited?.brand?.[slot]}
              onChange={(v) => onChange(["brand", slot], v)}
              mode="hex"
            />
          </Row>
        ))}
      </Section>

      <Section title="STATUS">
        {STATUS_KEYS.map((key) => (
          <Row key={key} label={key}>
            <ColorField
              value={data.status?.[key]}
              inherited={inherited?.status?.[key]}
              onChange={(v) => onChange(["status", key], v)}
              mode="hex-or-token"
            />
          </Row>
        ))}
      </Section>

      <Section title="FLAT">
        {FLAT_KEYS.map((key) => (
          <Row key={key} label={key}>
            <ColorField
              value={data.flat?.[key]}
              inherited={inherited?.flat?.[key]}
              onChange={(v) => onChange(["flat", key], v)}
              mode="hex"
            />
          </Row>
        ))}
      </Section>

      <Section title="SEMANTIC TOKENS">
        {SEMANTIC_KEYS.map((key) => (
          <Row key={key} label={key}>
            <ColorField
              value={data.semanticTokens?.[key]}
              inherited={inherited?.semanticTokens?.[key]}
              onChange={(v) => onChange(["semanticTokens", key], v)}
              mode="hex-or-token"
            />
          </Row>
        ))}
      </Section>
    </div>
  );
}
