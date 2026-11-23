import { Row } from "./Row";
import { SubRow } from "./SubRow";
import { FocusRingIcon } from "./EditorIcons";
import { ColorField } from "./ColorField";
import { TextField } from "./TextField";
import { BorderWidthSelect, BorderStyleSelect } from "./tokenSelects";
import type { EditorProps, RenderColorFn } from "./_types";
import { get, str } from "./_types";

type Props = EditorProps & { renderColor?: RenderColorFn };

/**
 * Edits OutlineTokens = { width?, style?, color?, offset? }.
 */
export function OutlineEditor({ data, inherited, onChange, renderColor }: Props) {
  const renderC: RenderColorFn = renderColor
    ?? (({ value, inherited: inh, onChange: oc }) => (
      <ColorField mode="token" value={str(value)} inherited={str(inh)} onChange={oc} />
    ));

  return (
    <>
      <Row icon={<FocusRingIcon />} label="Outline">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <BorderWidthSelect
            value={str(get(data, "width"))}
            inherited={str(get(inherited, "width"))}
            onChange={(v) => onChange(["width"], v)}
            className="flex-1 min-w-0"
          />
          <BorderStyleSelect
            value={str(get(data, "style"))}
            inherited={str(get(inherited, "style"))}
            onChange={(v) => onChange(["style"], v)}
            className="flex-1 min-w-0"
          />
        </div>
      </Row>
      <SubRow>
        {renderC({
          value: get(data, "color"),
          inherited: get(inherited, "color"),
          onChange: (v) => onChange(["color"], v),
        })}
      </SubRow>
      <SubRow label="offset">
        <TextField
          value={str(get(data, "offset"))}
          inherited={str(get(inherited, "offset"))}
          onChange={(v) => onChange(["offset"], v)}
          placeholder="0px"
        />
      </SubRow>
    </>
  );
}
