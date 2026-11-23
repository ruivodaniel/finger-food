// The editors' shared pieces: a labelled field, a grid that never overflows the sheet, a list of short lines, a select's options from pairs. Drawing only; no state, no saving.
import { Button, Input } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <Stack dir="col" scale="2xs" concept="knowledge-field"><span element="type--body-small" emphasis="quiet">{label}</span>{children}</Stack>;
/** n columns that never overflow the sheet */
export const Grid = ({ cols, children }: { cols: number; children: React.ReactNode }) => <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 12 }}>{children}</div>;
export const opts = (pairs: readonly (readonly [string, string])[]) => pairs.map(([value, label]) => ({ value, label }));
/** a row of an editable list: the fields given, a remove button at the end */
export const Row = ({ columns, onRemove, children }: { columns: string; onRemove: () => void; children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: `${columns} auto`, gap: 6, alignItems: "center" }}>
    {children}
    <Button buttonType="icon" startIcon="close" emphasis="tertiary" scale="xs" aria-label="remove" onClick={onRemove} />
  </div>
);
export const AddButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => <div><Button emphasis="tertiary" scale="xs" startIcon="add" onClick={onClick}>{children}</Button></div>;

/** a list of short lines: one input per line, remove, add at the end */
export function Lines({ label, items, onChange, placeholder, rows }: { label: string; items: string[]; onChange: (next: string[]) => void; placeholder: string; /** lines that may be long: a textarea's look is not needed, the input grows with its text */ rows?: number }) {
  void rows;
  return (
    <Field label={label}>
      <Stack dir="col" scale="xs">
        {items.map((it, i) => (
          <Row key={i} columns="minmax(0, 1fr)" onRemove={() => onChange(items.filter((_, j) => j !== i))}>
            <Input className="w-full" value={it} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} />
          </Row>
        ))}
        <AddButton onClick={() => onChange([...items, ""])}>{placeholder}</AddButton>
      </Stack>
    </Field>
  );
}
