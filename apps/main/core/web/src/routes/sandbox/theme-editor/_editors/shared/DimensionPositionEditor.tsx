import { Section } from "./Section";
import { Row } from "./Row";
import { TextField } from "./TextField";
import type { EditorProps } from "./_types";
import { get, str } from "./_types";

/**
 * Edits `DimensionPositionTokens` — width / height / translateX / translateY.
 *
 *   width, height     → emitted as CSS `width` / `height`
 *   translateX, translateY → composed into `transform: translateX(...) translateY(...)`
 *
 * All four fields accept any CSS length: "50%", "2rem", "-4px",
 * "var(--spacing-sm)", etc. Used e.g. for the switch thumb sliding:
 * `width: 50%` baseline + `translateX: 100%` on the selected combined entry.
 */
export function DimensionPositionEditor({ data, inherited, onChange }: EditorProps) {
  return (
    <Section title="Dimension & Position">
      <Row label="Width">
        <TextField
          value={str(get(data, "width"))}
          inherited={str(get(inherited, "width"))}
          onChange={(v) => onChange(["width"], v)}
          placeholder="auto"
        />
      </Row>
      <Row label="Height">
        <TextField
          value={str(get(data, "height"))}
          inherited={str(get(inherited, "height"))}
          onChange={(v) => onChange(["height"], v)}
          placeholder="auto"
        />
      </Row>
      <Row label="Translate X">
        <TextField
          value={str(get(data, "translateX"))}
          inherited={str(get(inherited, "translateX"))}
          onChange={(v) => onChange(["translateX"], v)}
          placeholder="0"
        />
      </Row>
      <Row label="Translate Y">
        <TextField
          value={str(get(data, "translateY"))}
          inherited={str(get(inherited, "translateY"))}
          onChange={(v) => onChange(["translateY"], v)}
          placeholder="0"
        />
      </Row>
    </Section>
  );
}
