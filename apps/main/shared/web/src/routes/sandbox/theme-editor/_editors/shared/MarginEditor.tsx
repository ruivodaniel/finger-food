import { useState } from "react";
import { Row } from "./Row";
import { SubRow } from "./SubRow";
import { ExpandToggle } from "./ExpandToggle";
import { MarginIcon } from "./EditorIcons";
import { SpacingSelect } from "./tokenSelects";
import type { EditorProps } from "./_types";
import { get, str } from "./_types";

const SIDES = ["top", "right", "bottom", "left"] as const;
const SUB_KEYS = ["x", "y", ...SIDES] as const;

/**
 * Edits MarginTokens = { all?, x?, y?, top?, right?, bottom?, left? }.
 *
 * Collapsed: only the `all` row is visible.
 * Expanded:  reveals `x`, `y`, and the four per-side rows.
 *
 * Auto-expands on mount whenever any sub-key is set so existing axis or
 * per-side overrides surface without a click.
 */
export function MarginEditor({ data, inherited, onChange }: EditorProps) {
  const [expanded, setExpanded] = useState(() =>
    SUB_KEYS.some((k) => get(data, k) != null),
  );

  return (
    <>
      <Row
        icon={<MarginIcon />}
        label="Margin"
        right={
          <ExpandToggle
            expanded={expanded}
            onToggle={() => setExpanded((e) => !e)}
          />
        }
      >
        <SpacingSelect
          value={str(get(data, "all"))}
          inherited={str(get(inherited, "all"))}
          onChange={(v) => onChange(["all"], v)}
        />
      </Row>
      {expanded && (
        <>
          <SubRow label="x">
            <SpacingSelect
              value={str(get(data, "x"))}
              inherited={str(get(inherited, "x"))}
              onChange={(v) => onChange(["x"], v)}
            />
          </SubRow>
          <SubRow label="y">
            <SpacingSelect
              value={str(get(data, "y"))}
              inherited={str(get(inherited, "y"))}
              onChange={(v) => onChange(["y"], v)}
            />
          </SubRow>
          {SIDES.map((side) => (
            <SubRow key={side} label={side}>
              <SpacingSelect
                value={str(get(data, side))}
                inherited={str(get(inherited, side))}
                onChange={(v) => onChange([side], v)}
              />
            </SubRow>
          ))}
        </>
      )}
    </>
  );
}
