import { Section } from "./Section";
import { Row } from "./Row";
import { TextField } from "./TextField";
import { SelectField } from "./SelectField";
import { TransitionDurationSelect, TransitionTimingSelect } from "./tokenSelects";
import type { EditorProps } from "./_types";
import { get, getObj, str } from "./_types";

const ANIM_DIRECTION_OPTS = [
  "normal",
  "alternate",
  "reverse",
  "alternate-reverse",
] as const;

/**
 * Sibling of `partialSurface` inside a StateStatusEntry — renders the entry's
 * own `transition` and `animation` config when an override pill is active.
 *
 * Path emissions are RELATIVE to the entry root (NOT to partialSurface):
 *   onChange(["transition", "duration"], v)
 *   onChange(["animation", "direction"], v)
 *
 * The PropertyPanel prefixes [basePath..., axis, key] before forwarding.
 */
export function OverrideMetaSection({ data, inherited, onChange }: EditorProps) {
  const transition = getObj(data, "transition");
  const inhTransition = getObj(inherited, "transition");
  const animation = getObj(data, "animation");
  const inhAnimation = getObj(inherited, "animation");

  return (
    <Section title="Transition & Animation">
      <Row label="Duration">
        <TransitionDurationSelect
          value={str(get(transition, "duration"))}
          inherited={str(get(inhTransition, "duration"))}
          onChange={(v) => onChange(["transition", "duration"], v)}
        />
      </Row>
      <Row label="Timing">
        <TransitionTimingSelect
          value={str(get(transition, "timing"))}
          inherited={str(get(inhTransition, "timing"))}
          onChange={(v) => onChange(["transition", "timing"], v)}
        />
      </Row>
      <Row label="Anim name">
        <TextField
          value={str(get(animation, "name"))}
          inherited={str(get(inhAnimation, "name"))}
          onChange={(v) => onChange(["animation", "name"], v)}
        />
      </Row>
      <Row label="Anim dur.">
        <TextField
          value={str(get(animation, "duration"))}
          inherited={str(get(inhAnimation, "duration"))}
          onChange={(v) => onChange(["animation", "duration"], v)}
        />
      </Row>
      <Row label="Iter.">
        <TextField
          value={str(get(animation, "iterationCount"))}
          inherited={str(get(inhAnimation, "iterationCount"))}
          onChange={(v) => onChange(["animation", "iterationCount"], v)}
        />
      </Row>
      <Row label="Direction">
        <SelectField
          value={str(get(animation, "direction"))}
          inherited={str(get(inhAnimation, "direction"))}
          onChange={(v) => onChange(["animation", "direction"], v)}
          options={ANIM_DIRECTION_OPTS}
        />
      </Row>
    </Section>
  );
}
