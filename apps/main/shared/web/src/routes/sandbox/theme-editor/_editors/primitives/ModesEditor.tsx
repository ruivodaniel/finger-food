import type {
  ThemeColorScheme,
  ColorModePreset,
} from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import { KeyedEntryList } from "../shared/KeyedEntryList";
import { Row } from "../shared/Row";
import { ColorField } from "../shared/ColorField";
import { DerivationEditor } from "./DerivationEditor";

/**
 * Sensible default for a newly-created mode. The user will tweak after
 * creation. Values stay anchor-token-friendly so the engine's derivation
 * pipeline stays valid (no circular refs to --background / --foreground).
 */
const DEFAULT_PRESET: ColorModePreset = {
  background: "main-white",
  foreground: "main-black",
  derivation: {
    brandLightAmount: 90,
    brandDarkAmount: 25,
    statusLightAmount: 90,
    statusDarkAmount: 25,
    grayColorMixPercentage: "5%",
    flatSaturationAdjust: 0,
  },
};

type Props = {
  data: ThemeColorScheme;
  inherited?: Partial<ThemeColorScheme>;
  onChange: OnChange;
};

/**
 * Color scheme (modes) CRUD — entries are keyed by user-defined name
 * (e.g. "light", "dark", "high-contrast"). Each entry holds a
 * ColorModePreset with bg / fg anchors and a derivation config.
 *
 * Same chrome as EffectsEditor (add / rename / delete via KeyedEntryList).
 */
export function ModesEditor({ data, inherited, onChange }: Props) {
  return (
    <KeyedEntryList<ColorModePreset>
      title="COLOR SCHEME"
      entries={data}
      inherited={inherited}
      onChange={onChange}
      newEntry={() => ({
        ...DEFAULT_PRESET,
        derivation: { ...DEFAULT_PRESET.derivation },
      })}
      newEntryNamePrefix="mode"
      renderBody={({ value, inherited: inh, onChange: bodyOnChange }) => (
        <>
          <Row label="bg">
            <ColorField
              value={value.background}
              inherited={inh?.background}
              onChange={(v) => bodyOnChange(["background"], v)}
              mode="anchor-or-hex"
            />
          </Row>
          <Row label="fg">
            <ColorField
              value={value.foreground}
              inherited={inh?.foreground}
              onChange={(v) => bodyOnChange(["foreground"], v)}
              mode="anchor-or-hex"
            />
          </Row>
          <DerivationEditor
            data={value.derivation}
            inherited={inh?.derivation}
            onChange={(path, v) => bodyOnChange(["derivation", ...path], v)}
          />
        </>
      )}
    />
  );
}
