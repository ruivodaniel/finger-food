import { Row } from "./Row";
import { TransitionIcon } from "./EditorIcons";
import { TransitionDurationSelect, TransitionTimingSelect } from "./tokenSelects";
import type { EditorProps } from "./_types";
import { get, str } from "./_types";

/**
 * Edits TransitionTokens = { duration?, timing? }.
 */
export function TransitionEditor({ data, inherited, onChange }: EditorProps) {
  return (
    <Row icon={<TransitionIcon />} label="Transition">
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <TransitionDurationSelect
          value={str(get(data, "duration"))}
          inherited={str(get(inherited, "duration"))}
          onChange={(v) => onChange(["duration"], v)}
          className="flex-1 min-w-0"
        />
        <TransitionTimingSelect
          value={str(get(data, "timing"))}
          inherited={str(get(inherited, "timing"))}
          onChange={(v) => onChange(["timing"], v)}
          className="flex-1 min-w-0"
        />
      </div>
    </Row>
  );
}
