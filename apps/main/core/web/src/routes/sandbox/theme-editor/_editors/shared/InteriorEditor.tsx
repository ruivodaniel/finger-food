import { useState } from "react";
import { Section } from "./Section";
import { Row } from "./Row";
import { SubRow } from "./SubRow";
import {
  FillIcon,
  FgIcon,
  OpacityIcon,
  SeparatorIcon,
} from "./EditorIcons";
import { ColorField } from "./ColorField";
import { NumberField } from "./NumberField";
import { TextField } from "./TextField";
import { SelectField } from "./SelectField";
import { SegmentedSelect } from "./SegmentedSelect";
import { PaddingEditor } from "./PaddingEditor";
import { GapEditor } from "./GapEditor";
import type { EditorProps, RenderColorFn } from "./_types";
import { get, getObj, num, str, withPrefix } from "./_types";

const ALIGN_OPTIONS = [
  { value: "start", label: "S" },
  { value: "center", label: "C" },
  { value: "end", label: "E" },
  { value: "stretch", label: "—" },
  { value: "baseline", label: "B" },
] as const;

type Props = EditorProps & {
  renderColor?: RenderColorFn;
};

/**
 * Edits InteriorTokens (InteriorSelfTokens & InteriorChildrenTokens).
 *
 * Sections rendered as rows:
 *   - background (+ backgroundAlpha)
 *   - foreground
 *   - opacity
 *   - padding (PaddingEditor)
 *   - gap (GapEditor)
 *   - childAlign (horizontal / vertical SegmentedSelect)
 *   - separator ('none' | inline surface — collapsible)
 *   - scrollbar (collapsible)
 */
export function InteriorEditor({ data, inherited, onChange, renderColor }: Props) {
  const renderC: RenderColorFn = renderColor
    ?? (({ value, inherited: inh, onChange: oc }) => (
      <ColorField mode="token" value={str(value)} inherited={str(inh)} onChange={oc} />
    ));

  const childAlign = getObj(data, "childAlign");
  const childAlignInh = getObj(inherited, "childAlign");

  return (
    <Section title="Interior">
      <Row icon={<FillIcon />} label="Fill">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {renderC({
            value: get(data, "background"),
            inherited: get(inherited, "background"),
            onChange: (v) => onChange(["background"], v),
          })}
          <NumberField
            value={num(get(data, "backgroundAlpha"))}
            inherited={num(get(inherited, "backgroundAlpha"))}
            onChange={(v) => onChange(["backgroundAlpha"], v)}
            step={0.05}
            min={0}
            max={1}
            className="w-14 shrink-0"
          />
        </div>
      </Row>

      <Row icon={<FgIcon />} label="Fg">
        {renderC({
          value: get(data, "foreground"),
          inherited: get(inherited, "foreground"),
          onChange: (v) => onChange(["foreground"], v),
        })}
      </Row>

      <Row icon={<OpacityIcon />} label="Opacity">
        <NumberField
          value={num(get(data, "opacity"))}
          inherited={num(get(inherited, "opacity"))}
          onChange={(v) => onChange(["opacity"], v)}
          step={0.05}
          min={0}
          max={1}
        />
      </Row>

      <PaddingEditor
        data={getObj(data, "padding")}
        inherited={getObj(inherited, "padding")}
        onChange={withPrefix(onChange, ["padding"])}
      />

      <GapEditor
        data={getObj(data, "gap")}
        inherited={getObj(inherited, "gap")}
        onChange={withPrefix(onChange, ["gap"])}
      />

      <Row label="Align H">
        <SegmentedSelect
          value={str(get(childAlign, "horizontal"))}
          inherited={str(get(childAlignInh, "horizontal"))}
          onChange={(v) => onChange(["childAlign", "horizontal"], v)}
          options={ALIGN_OPTIONS}
        />
      </Row>
      <Row label="Align V">
        <SegmentedSelect
          value={str(get(childAlign, "vertical"))}
          inherited={str(get(childAlignInh, "vertical"))}
          onChange={(v) => onChange(["childAlign", "vertical"], v)}
          options={ALIGN_OPTIONS}
        />
      </Row>

      <SeparatorField
        data={get(data, "separator")}
        inherited={get(inherited, "separator")}
        onChange={(v) => onChange(["separator"], v)}
        onChangeNested={(p, v) => onChange(["separator", ...p], v)}
        renderColor={renderColor}
      />

      <ScrollbarField
        data={getObj(data, "scrollbar")}
        inherited={getObj(inherited, "scrollbar")}
        onChange={withPrefix(onChange, ["scrollbar"])}
        renderColor={renderC}
      />
    </Section>
  );
}

// ── Separator ───────────────────────────────────────────────────────────────

function SeparatorField({
  data,
  inherited,
  onChange,
  onChangeNested,
  renderColor,
}: {
  data: unknown;
  inherited: unknown;
  onChange: (v: unknown) => void;
  onChangeNested: (path: string[], v: unknown) => void;
  renderColor?: RenderColorFn;
}) {
  const isNone = data === "none" || (data == null && inherited === "none");
  const isCustom = data != null && typeof data === "object";
  const mode: "none" | "custom" = isCustom ? "custom" : "none";

  return (
    <>
      <Row icon={<SeparatorIcon />} label="Separator">
        <SelectField
          value={isNone ? "none" : isCustom ? "custom" : undefined}
          onChange={(v) => {
            if (v === "none") onChange("none");
            else if (v === "custom") onChange({ surface: {} });
            else onChange(undefined);
          }}
          options={["none", "custom"]}
        />
      </Row>
      {mode === "custom" && (
        <SubRow>
          {/* Recursive — separator.surface is itself a SurfaceContainerTokens.
              Deferring the import to avoid evaluation cycles. */}
          <DeferredSurfaceEditor
            data={((data as Record<string, unknown>).surface as Record<string, unknown> | undefined) ?? {}}
            inherited={{}}
            onChange={(p, v) => onChangeNested(["surface", ...p], v)}
            effectKeys={[]}
            renderColor={renderColor}
            scoped
          />
        </SubRow>
      )}
    </>
  );
}

// ── Scrollbar ───────────────────────────────────────────────────────────────

function ScrollbarField({
  data,
  inherited,
  onChange,
  renderColor,
}: {
  data: Record<string, unknown>;
  inherited: Record<string, unknown>;
  onChange: (path: string[], v: unknown) => void;
  renderColor: RenderColorFn;
}) {
  const has = Object.keys(data).length > 0 || Object.keys(inherited).length > 0;
  const [open, setOpen] = useState(has);
  return (
    <>
      <Row
        label="Scrollbar"
        right={
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-[10px] text-zinc-500 hover:text-zinc-900"
          >
            {open ? "▾" : "▸"}
          </button>
        }
      >
        <span className="text-[10px] text-zinc-400 italic">
          {open ? "" : has ? "(set)" : "(unset)"}
        </span>
      </Row>
      {open && (
        <>
          <SubRow label="thumb">
            {renderColor({
              value: get(data, "thumbColor"),
              inherited: get(inherited, "thumbColor"),
              onChange: (v) => onChange(["thumbColor"], v),
            })}
          </SubRow>
          <SubRow label="track">
            {renderColor({
              value: get(data, "trackColor"),
              inherited: get(inherited, "trackColor"),
              onChange: (v) => onChange(["trackColor"], v),
            })}
          </SubRow>
          <SubRow label="width">
            <TextField
              value={str(get(data, "width"))}
              inherited={str(get(inherited, "width"))}
              onChange={(v) => onChange(["width"], v)}
              placeholder="6px"
            />
          </SubRow>
        </>
      )}
    </>
  );
}

// Lazy SurfaceEditor reference to break the import cycle InteriorEditor ↔ SurfaceEditor.
// The actual import resolves at module load; React only invokes it at render time.
import { SurfaceEditor } from "./SurfaceEditor";

function DeferredSurfaceEditor(
  props: React.ComponentProps<typeof SurfaceEditor> & { scoped?: boolean },
) {
  const { scoped: _scoped, ...rest } = props;
  return <SurfaceEditor {...rest} />;
}
