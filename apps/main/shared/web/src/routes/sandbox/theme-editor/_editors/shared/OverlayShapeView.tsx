import { Section } from "./Section";
import { Row } from "./Row";
import { SubRow } from "./SubRow";
import { ColorField } from "./ColorField";
import { NumberField } from "./NumberField";
import { TextField } from "./TextField";
import { SelectField } from "./SelectField";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";
import { get, getObj, num, str } from "./_types";

const ANIM_DIRECTION_OPTS = [
  "normal",
  "alternate",
  "reverse",
  "alternate-reverse",
] as const;

/**
 * Editor for `OverlayTokens` (the scrim + entrance/exit animations
 * configuration of an elevated overlay family).
 *
 * Currently no overrides for overlay; just rows.
 */
export function OverlayShapeView({ data, inherited, onChange }: ShapeEditorProps) {
  const t = (data ?? {}) as Record<string, unknown>;
  const inh = (inherited as Record<string, unknown> | undefined) ?? undefined;
  const entrance = getObj(t, "entranceAnimation");
  const exit = getObj(t, "exitAnimation");
  const inhEntrance = getObj(inh, "entranceAnimation");
  const inhExit = getObj(inh, "exitAnimation");

  return (
    <>
      <Section title="Scrim">
        <Row label="color">
          <ColorField
            mode="token"
            value={str(get(t, "scrimColor"))}
            inherited={str(get(inh, "scrimColor"))}
            onChange={(v) => onChange(["scrimColor"], v)}
          />
        </Row>
        <Row label="opacity">
          <NumberField
            value={num(get(t, "scrimOpacity"))}
            inherited={num(get(inh, "scrimOpacity"))}
            onChange={(v) => onChange(["scrimOpacity"], v)}
            step={0.05}
            min={0}
            max={1}
          />
        </Row>
        <Row label="blur">
          <TextField
            value={str(get(t, "scrimBlur"))}
            inherited={str(get(inh, "scrimBlur"))}
            onChange={(v) => onChange(["scrimBlur"], v)}
            placeholder="0px"
          />
        </Row>
      </Section>

      <Section title="Entrance">
        <AnimationRows
          anim={entrance}
          inh={inhEntrance}
          onChange={(p, v) => onChange(["entranceAnimation", ...p], v)}
        />
      </Section>
      <Section title="Exit">
        <AnimationRows
          anim={exit}
          inh={inhExit}
          onChange={(p, v) => onChange(["exitAnimation", ...p], v)}
        />
      </Section>
    </>
  );
}

function AnimationRows({
  anim,
  inh,
  onChange,
}: {
  anim: Record<string, unknown>;
  inh: Record<string, unknown>;
  onChange: (path: string[], value: unknown) => void;
}) {
  return (
    <>
      <Row label="name">
        <TextField
          value={str(get(anim, "name"))}
          inherited={str(get(inh, "name"))}
          onChange={(v) => onChange(["name"], v)}
        />
      </Row>
      <Row label="duration">
        <TextField
          value={str(get(anim, "duration"))}
          inherited={str(get(inh, "duration"))}
          onChange={(v) => onChange(["duration"], v)}
          placeholder="200ms"
        />
      </Row>
      <Row label="timing">
        <TextField
          value={str(get(anim, "timing"))}
          inherited={str(get(inh, "timing"))}
          onChange={(v) => onChange(["timing"], v)}
          placeholder="ease-out"
        />
      </Row>
      <Row label="iter.">
        <TextField
          value={str(get(anim, "iterationCount"))}
          inherited={str(get(inh, "iterationCount"))}
          onChange={(v) => onChange(["iterationCount"], v)}
          placeholder="1"
        />
      </Row>
      <Row label="direction">
        <SelectField
          value={str(get(anim, "direction"))}
          inherited={str(get(inh, "direction"))}
          onChange={(v) => onChange(["direction"], v)}
          options={ANIM_DIRECTION_OPTS}
        />
      </Row>
      <SubRow />
    </>
  );
}
