import { useState } from "react";
import { Row } from "./Row";
import { SubRow } from "./SubRow";
import { ExpandToggle } from "./ExpandToggle";
import { GapIcon } from "./EditorIcons";
import { SpacingSelect } from "./tokenSelects";
import type { EditorProps } from "./_types";
import { get, str } from "./_types";

/**
 * Edits GapTokens = { all?, h?, v? }.
 * Collapsed: single `all`. Expanded: h + v.
 */
export function GapEditor({ data, inherited, onChange }: EditorProps) {
  const [expanded, setExpanded] = useState(
    () => get(data, "h") != null || get(data, "v") != null,
  );

  return (
    <>
      <Row
        icon={<GapIcon />}
        label="Gap"
        right={<ExpandToggle expanded={expanded} onToggle={() => setExpanded((e) => !e)} />}
      >
        <SpacingSelect
          value={str(get(data, "all"))}
          inherited={str(get(inherited, "all"))}
          onChange={(v) => onChange(["all"], v)}
        />
      </Row>
      {expanded && (
        <>
          <SubRow label="h">
            <SpacingSelect
              value={str(get(data, "h"))}
              inherited={str(get(inherited, "h"))}
              onChange={(v) => onChange(["h"], v)}
            />
          </SubRow>
          <SubRow label="v">
            <SpacingSelect
              value={str(get(data, "v"))}
              inherited={str(get(inherited, "v"))}
              onChange={(v) => onChange(["v"], v)}
            />
          </SubRow>
        </>
      )}
    </>
  );
}
