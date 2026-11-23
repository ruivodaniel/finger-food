import { Row } from "./Row";
import { TextField } from "./TextField";
import type { OnChange } from "../../_core/types";
import { get, str } from "./_types";

type Props = {
  data: Record<string, unknown> | undefined;
  inherited?: Record<string, unknown> | undefined;
  onChange: OnChange;
};

/**
 * Tiny inline editor for `Obfuscation` — used inside the field shape's
 * "Other Properties" group. Doesn't get its own accordion; it's just
 * three rows.
 */
export function ObfuscationView({ data, inherited, onChange }: Props) {
  const t = data ?? {};
  const inh = inherited ?? {};
  return (
    <>
      <Row label="char.">
        <TextField
          value={str(get(t, "character"))}
          inherited={str(get(inh, "character"))}
          onChange={(v) => onChange(["character"], v)}
          placeholder="•"
        />
      </Row>
      <Row label="letter sp.">
        <TextField
          value={str(get(t, "letterSpacing"))}
          inherited={str(get(inh, "letterSpacing"))}
          onChange={(v) => onChange(["letterSpacing"], v)}
          placeholder="0.2em"
        />
      </Row>
      <Row label="font size">
        <TextField
          value={str(get(t, "fontSize"))}
          inherited={str(get(inh, "fontSize"))}
          onChange={(v) => onChange(["fontSize"], v)}
          placeholder="1em"
        />
      </Row>
    </>
  );
}
