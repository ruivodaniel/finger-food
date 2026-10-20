import type {
  ThemeEffects,
  EffectLayer,
} from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import { KeyedEntryList } from "../shared/KeyedEntryList";
import { ShadowLayerEditor } from "../shared/ShadowLayerEditor";

type Props = {
  data: ThemeEffects;
  inherited?: Partial<ThemeEffects>;
  onChange: OnChange;
};

/**
 * Effects CRUD — entries are keyed by user-defined name (e.g. "card",
 * "overlay", "focus"). Each entry holds a stack of EffectLayer items.
 *
 * Outer chrome (add / rename / delete) comes from KeyedEntryList.
 * Inner body uses the shared ShadowLayerEditor (add / remove / reorder layers).
 */
export function EffectsEditor({ data, inherited, onChange }: Props) {
  return (
    <KeyedEntryList<EffectLayer[]>
      title="EFFECTS"
      entries={data}
      inherited={inherited}
      onChange={onChange}
      newEntry={() => []}
      newEntryNamePrefix="effect"
      renderSummary={(value) =>
        `${value.length} layer${value.length === 1 ? "" : "s"}`
      }
      renderBody={({ value, onChange: bodyOnChange }) => (
        <ShadowLayerEditor
          layers={value}
          path={[]}
          onChange={bodyOnChange}
        />
      )}
    />
  );
}
