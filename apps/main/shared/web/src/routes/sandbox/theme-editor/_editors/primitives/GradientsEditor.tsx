import type { GradientDef } from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import { KeyedEntryList } from "../shared/KeyedEntryList";
import { GradientLayerEditor } from "../shared/GradientLayerEditor";
import { gradientCss } from "../shared/gradientCss";

type Props = {
  data: Record<string, GradientDef>;
  inherited?: Partial<Record<string, GradientDef>>;
  onChange: OnChange;
};

/**
 * Gradients CRUD — entries are keyed by user-defined name (e.g. "hero",
 * "subtle"). Referenced from outside as `gradient-<name>` in any ColorRef
 * field, parallel to how `effect-<name>` works for shadow effects.
 *
 * Outer chrome (add / rename / delete) comes from KeyedEntryList.
 * Inner body uses GradientLayerEditor (type, type-specific fields, stops).
 */
export function GradientsEditor({ data, inherited, onChange }: Props) {
  return (
    <KeyedEntryList<GradientDef>
      title="GRADIENTS"
      entries={data}
      inherited={inherited}
      onChange={onChange}
      newEntry={() => ({ type: "linear", angle: 0, stops: [] })}
      newEntryNamePrefix="gradient"
      renderSummary={(value) => (
        <span
          className="inline-block w-12 h-3 rounded-sm border border-zinc-200 align-middle"
          style={{ background: gradientCss(value) }}
        />
      )}
      renderBody={({ value, onChange: bodyOnChange }) => (
        <GradientLayerEditor data={value} onChange={bodyOnChange} />
      )}
    />
  );
}
