import type { ThemeModes } from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { SegmentedSelect } from "../shared/SegmentedSelect";
import { ModesEditor } from "./ModesEditor";

const DENSITY_OPTS = [
  { value: "compact", label: "compact" },
  { value: "default", label: "default" },
  { value: "spacious", label: "spacious" },
] as const;

const TEXT_SIZE_OPTS = [
  { value: "small", label: "small" },
  { value: "default", label: "default" },
  { value: "large", label: "large" },
] as const;

type Props = {
  data: ThemeModes;
  onChange: OnChange;
};

/**
 * Editor for the full `ThemeModes` shape — wraps the colorScheme CRUD
 * (which is its own ModesEditor → KeyedEntryList) plus the density and
 * textSize global selectors that live alongside it under theme.modes.
 */
export function ThemeModesView({ data, onChange }: Props) {
  return (
    <>
      <Section title="GLOBAL">
        <Row label="density">
          <SegmentedSelect
            value={data.density}
            onChange={(v) =>
              onChange(["density"], v as ThemeModes["density"] | undefined)
            }
            options={DENSITY_OPTS}
          />
        </Row>
        <Row label="text size">
          <SegmentedSelect
            value={data.textSize}
            onChange={(v) =>
              onChange(["textSize"], v as ThemeModes["textSize"] | undefined)
            }
            options={TEXT_SIZE_OPTS}
          />
        </Row>
      </Section>
      <ModesEditor
        data={data.colorScheme ?? {}}
        onChange={(p, v) => onChange(["colorScheme", ...p], v)}
      />
    </>
  );
}
