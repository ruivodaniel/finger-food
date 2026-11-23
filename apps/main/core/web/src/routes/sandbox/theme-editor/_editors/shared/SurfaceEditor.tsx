import { Section } from "./Section";
import { Row } from "./Row";
import { TintIcon, CursorIcon, BleedIcon } from "./EditorIcons";
import { ColorField } from "./ColorField";
import { SegmentedSelect } from "./SegmentedSelect";
import { CursorSelect } from "./tokenSelects";
import { BoundaryEditor } from "./BoundaryEditor";
import { DimensionPositionEditor } from "./DimensionPositionEditor";
import { InteriorEditor } from "./InteriorEditor";
import { TypographySurfaceEditor } from "./TypographySurfaceEditor";
import { TransitionEditor } from "./TransitionEditor";
import type { EditorProps, RenderColorFn } from "./_types";
import { get, getObj, str, withPrefix } from "./_types";

const SMART_BLEED_OPTIONS = [
  { value: "normal", label: "norm" },
  { value: "rounded", label: "round" },
  { value: "border", label: "bord" },
  { value: "border-rounded", label: "b+r" },
  { value: "false", label: "off" },
] as const;

type Props = EditorProps & {
  /** Available effect token names from `Object.keys(theme.effects)`. */
  effectKeys: readonly string[];
  /** Optional override for how color fields render. Defaults to ColorField/'token' mode. */
  renderColor?: RenderColorFn;
};

/**
 * Edits `SurfaceContainerTokens` — the universal base shape.
 *
 * Sections rendered top-to-bottom:
 *   1. Boundary           — radius, border, effect, outline
 *   2. Dimension+Position — width, height, translateX, translateY
 *   3. Interior           — fill, fg, opacity, padding, gap, childAlign, separator, scrollbar
 *   4. Typography         — typographyType, transform, decoration, align, textEffect
 *   5. Misc               — tint, cursor, smartBleed, transition
 *
 * Combined orthogonal overrides (state / status / emphasis) are NOT rendered
 * here — they're handled by SurfaceShapeView via an OverrideAxisSelector
 * that re-mounts SurfaceEditor scoped into the active entry's
 * `partialSurface` slot.
 *
 * Surface nesting (some families wrap their tokens under `surface`) is the
 * caller's responsibility — feed already-unwrapped SurfaceContainerTokens here.
 */
export function SurfaceEditor({
  data,
  inherited,
  onChange,
  effectKeys,
  renderColor,
}: Props) {
  return (
    <div>
      <BoundaryEditor
        data={getObj(data, "boundary")}
        inherited={getObj(inherited, "boundary")}
        onChange={withPrefix(onChange, ["boundary"])}
        effectKeys={effectKeys}
        renderColor={renderColor}
      />
      <DimensionPositionEditor
        data={getObj(data, "dimensionPosition")}
        inherited={getObj(inherited, "dimensionPosition")}
        onChange={withPrefix(onChange, ["dimensionPosition"])}
      />
      <InteriorEditor
        data={getObj(data, "interior")}
        inherited={getObj(inherited, "interior")}
        onChange={withPrefix(onChange, ["interior"])}
        renderColor={renderColor}
      />
      <TypographySurfaceEditor
        data={getObj(data, "defaultTypography")}
        inherited={getObj(inherited, "defaultTypography")}
        onChange={withPrefix(onChange, ["defaultTypography"])}
        renderColor={renderColor}
      />
      <Section title="Misc">
        <Row icon={<TintIcon />} label="Tint">
          {renderColor ? (
            renderColor({
              value: get(data, "tint"),
              inherited: get(inherited, "tint"),
              onChange: (v) => onChange(["tint"], v),
            })
          ) : (
            <ColorField
              mode="token"
              value={str(get(data, "tint"))}
              inherited={str(get(inherited, "tint"))}
              onChange={(v) => onChange(["tint"], v)}
            />
          )}
        </Row>
        <Row icon={<CursorIcon />} label="Cursor">
          <CursorSelect
            value={str(get(data, "cursor"))}
            inherited={str(get(inherited, "cursor"))}
            onChange={(v) => onChange(["cursor"], v)}
          />
        </Row>
        <Row icon={<BleedIcon />} label="Bleed">
          <SegmentedSelect
            value={str(get(data, "smartBleed"))}
            inherited={str(get(inherited, "smartBleed"))}
            onChange={(v) => onChange(["smartBleed"], v)}
            options={SMART_BLEED_OPTIONS}
          />
        </Row>
        <TransitionEditor
          data={getObj(data, "transition")}
          inherited={getObj(inherited, "transition")}
          onChange={withPrefix(onChange, ["transition"])}
        />
      </Section>
    </div>
  );
}
