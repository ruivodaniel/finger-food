import { Section } from "./Section";
import { Row } from "./Row";
import { SubRow } from "./SubRow";
import {
  TypoScaleIcon,
  TransformIcon,
  DecorationIcon,
  TextFxIcon,
} from "./EditorIcons";
import { SelectField } from "./SelectField";
import { SegmentedSelect } from "./SegmentedSelect";
import { ColorField } from "./ColorField";
import { NumberField } from "./NumberField";
import { TypographyTypeSelect } from "./tokenSelects";
import type { EditorProps, RenderColorFn } from "./_types";
import { get, num, str } from "./_types";

const TRANSFORM_OPTS = ["none", "uppercase", "lowercase", "capitalize"];
const DECORATION_OPTS = ["none", "underline", "line-through"];
const ALIGN_OPTS = [
  { value: "left", label: "L" },
  { value: "center", label: "C" },
  { value: "right", label: "R" },
  { value: "justify", label: "J" },
] as const;

type Props = EditorProps & {
  renderColor?: RenderColorFn;
};

/**
 * Edits TypographyTokens — defaultTypography on a SurfaceContainer.
 * Note: typography color is owned by InteriorTokens.foreground, not here.
 */
export function TypographySurfaceEditor({ data, inherited, onChange, renderColor }: Props) {
  return (
    <Section title="Typography">
      <Row icon={<TypoScaleIcon />} label="Scale">
        <TypographyTypeSelect
          value={str(get(data, "typographyType"))}
          inherited={str(get(inherited, "typographyType"))}
          onChange={(v) => onChange(["typographyType"], v)}
        />
      </Row>
      <Row icon={<TransformIcon />} label="Transform">
        <SelectField
          value={str(get(data, "textTransform"))}
          inherited={str(get(inherited, "textTransform"))}
          onChange={(v) => onChange(["textTransform"], v)}
          options={TRANSFORM_OPTS}
        />
      </Row>
      <Row icon={<DecorationIcon />} label="Decoration">
        <SelectField
          value={str(get(data, "textDecoration"))}
          inherited={str(get(inherited, "textDecoration"))}
          onChange={(v) => onChange(["textDecoration"], v)}
          options={DECORATION_OPTS}
        />
      </Row>
      <Row label="Align">
        <SegmentedSelect
          value={str(get(data, "textAlign"))}
          inherited={str(get(inherited, "textAlign"))}
          onChange={(v) => onChange(["textAlign"], v)}
          options={ALIGN_OPTS}
        />
      </Row>
      <TextEffectField
        layers={(get(data, "textEffect") as unknown[] | undefined) ?? []}
        onChange={(v) => onChange(["textEffect"], v)}
        renderColor={renderColor}
      />
    </Section>
  );
}

function TextEffectField({
  layers,
  onChange,
  renderColor,
}: {
  layers: unknown[];
  onChange: (v: unknown) => void;
  renderColor?: RenderColorFn;
}) {
  const arr = layers as Record<string, unknown>[];
  const update = (i: number, next: Record<string, unknown>) => {
    const copy = [...arr];
    copy[i] = next;
    onChange(copy);
  };
  const remove = (i: number) => onChange(arr.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([
      ...arr,
      { type: "text-shadow", x: 0, y: 1, blur: 2, color: "main-black", opacity: 0.2 },
    ]);

  const renderC: RenderColorFn = renderColor
    ?? (({ value, inherited: inh, onChange: oc }) => (
      <ColorField mode="hex-or-token" value={str(value)} inherited={str(inh)} onChange={oc} />
    ));

  return (
    <>
      <Row
        icon={<TextFxIcon />}
        label="Text fx"
        right={
          <button
            type="button"
            onClick={add}
            className="text-[10px] text-blue-500 hover:text-blue-700 px-1"
          >
            + add
          </button>
        }
      >
        <span className="text-[10px] text-zinc-400">
          {arr.length} layer{arr.length === 1 ? "" : "s"}
        </span>
      </Row>
      {arr.map((layer, i) => (
        <SubRow key={i} label={`#${i + 1}`}>
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <NumberField
              value={num(layer.x)}
              onChange={(v) => update(i, { ...layer, x: v })}
              step={1}
              className="w-12 shrink-0"
            />
            <NumberField
              value={num(layer.y)}
              onChange={(v) => update(i, { ...layer, y: v })}
              step={1}
              className="w-12 shrink-0"
            />
            <NumberField
              value={num(layer.blur)}
              onChange={(v) => update(i, { ...layer, blur: v })}
              step={1}
              className="w-12 shrink-0"
            />
            <NumberField
              value={num(layer.opacity)}
              onChange={(v) => update(i, { ...layer, opacity: v })}
              step={0.05}
              min={0}
              max={1}
              className="w-12 shrink-0"
            />
            <div className="flex-1 min-w-0">
              {renderC({
                value: layer.color,
                inherited: undefined,
                onChange: (v) => update(i, { ...layer, color: v }),
              })}
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-[10px] text-red-400 hover:text-red-600 px-1 shrink-0"
            >
              ×
            </button>
          </div>
        </SubRow>
      ))}
    </>
  );
}
