import { useState } from "react";
import { Row } from "./Row";
import { SubRow } from "./SubRow";
import { ExpandToggle } from "./ExpandToggle";
import { StrokeIcon } from "./EditorIcons";
import { ColorField } from "./ColorField";
import { BorderWidthSelect, BorderStyleSelect } from "./tokenSelects";
import type { EditorProps, RenderColorFn } from "./_types";
import { get, getObj, str } from "./_types";

const SIDES = ["top", "right", "bottom", "left"] as const;

type Props = EditorProps & {
  /** Optional injection — defaults to ColorField in 'token' mode. */
  renderColor?: RenderColorFn;
};

/**
 * Edits BorderTokens = { width?, style?, color?, top?, right?, bottom?, left? }.
 * Collapsed: width + style + color on one row.
 * Expanded: per-side rows, each with its own width/style/color.
 */
export function BorderEditor({ data, inherited, onChange, renderColor }: Props) {
  const [expanded, setExpanded] = useState(() =>
    SIDES.some((s) => get(data, s) != null),
  );

  const renderC: RenderColorFn = renderColor
    ?? (({ value, inherited: inh, onChange: oc }) => (
      <ColorField mode="token" value={str(value)} inherited={str(inh)} onChange={oc} />
    ));

  return (
    <>
      <Row
        icon={<StrokeIcon />}
        label="Border"
        right={<ExpandToggle expanded={expanded} onToggle={() => setExpanded((e) => !e)} />}
      >
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
      {expanded &&
        SIDES.map((side) => {
          const sd = getObj(data, side);
          const si = getObj(inherited, side);
          return (
            <SubRow key={side} label={side[0].toUpperCase() + side.slice(1)}>
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <BorderWidthSelect
                  value={str(get(sd, "width"))}
                  inherited={str(get(si, "width"))}
                  onChange={(v) => onChange([side, "width"], v)}
                  className="flex-1 min-w-0"
                />
                <BorderStyleSelect
                  value={str(get(sd, "style"))}
                  inherited={str(get(si, "style"))}
                  onChange={(v) => onChange([side, "style"], v)}
                  className="flex-1 min-w-0"
                />
                {renderC({
                  value: get(sd, "color"),
                  inherited: get(si, "color"),
                  onChange: (v) => onChange([side, "color"], v),
                })}
              </div>
            </SubRow>
          );
        })}
    </>
  );
}
