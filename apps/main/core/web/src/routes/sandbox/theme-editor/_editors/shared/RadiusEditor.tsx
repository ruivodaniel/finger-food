import { useState } from "react";
import { Row } from "./Row";
import { SubRow } from "./SubRow";
import { ExpandToggle } from "./ExpandToggle";
import { RadiusIcon } from "./EditorIcons";
import { RadiusSelect } from "./tokenSelects";
import type { EditorProps } from "./_types";
import { get, str } from "./_types";

const CORNERS = ["topLeft", "topRight", "bottomRight", "bottomLeft"] as const;
const CORNER_LABELS: Record<(typeof CORNERS)[number], string> = {
  topLeft: "TL",
  topRight: "TR",
  bottomRight: "BR",
  bottomLeft: "BL",
};

/**
 * Edits RadiusTokens = { all?, topLeft?, topRight?, bottomRight?, bottomLeft? }.
 * Collapsed: single `all` row. Expanded: per-corner rows.
 */
export function RadiusEditor({ data, inherited, onChange }: EditorProps) {
  const [expanded, setExpanded] = useState(
    () => CORNERS.some((c) => data[c] != null),
  );

  const allValue = str(get(data, "all"));
  const allInherited = str(get(inherited, "all"));

  return (
    <>
      <Row
        icon={<RadiusIcon />}
        label="Radius"
        right={<ExpandToggle expanded={expanded} onToggle={() => setExpanded((e) => !e)} />}
      >
        <RadiusSelect
          value={allValue}
          inherited={allInherited}
          onChange={(v) => onChange(["all"], v)}
        />
      </Row>
      {expanded &&
        CORNERS.map((corner) => (
          <SubRow key={corner} label={CORNER_LABELS[corner]}>
            <RadiusSelect
              value={str(get(data, corner))}
              inherited={str(get(inherited, corner))}
              onChange={(v) => onChange([corner], v)}
            />
          </SubRow>
        ))}
    </>
  );
}
