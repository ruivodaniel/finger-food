import { Section } from "./Section";
import { Row } from "./Row";
import { EffectIcon } from "./EditorIcons";
import { RadiusEditor } from "./RadiusEditor";
import { BorderEditor } from "./BorderEditor";
import { OutlineEditor } from "./OutlineEditor";
import { MarginEditor } from "./MarginEditor";
import { ShadowLayerEditor } from "./ShadowLayerEditor";
import { EffectTokenSelect } from "./tokenSelects";
import type { EditorProps, RenderColorFn } from "./_types";
import { get, getObj, str, withPrefix } from "./_types";

type Props = EditorProps & {
  /** Available effect token names from `Object.keys(theme.effects)`. */
  effectKeys: readonly string[];
  renderColor?: RenderColorFn;
};

/**
 * Edits BoundaryTokens = { border?, radius?, effect?, outline? }.
 * Composed of RadiusEditor + BorderEditor + EffectField + OutlineEditor.
 *
 * Effect can be either a token name (string) or an inline EffectLayer[] stack.
 * The EffectField toggle lets the user switch — switching converts the value.
 */
export function BoundaryEditor({
  data,
  inherited,
  onChange,
  effectKeys,
  renderColor,
}: Props) {
  return (
    <Section title="Boundary">
      <MarginEditor
        data={getObj(data, "margin")}
        inherited={getObj(inherited, "margin")}
        onChange={withPrefix(onChange, ["margin"])}
      />
      <RadiusEditor
        data={getObj(data, "radius")}
        inherited={getObj(inherited, "radius")}
        onChange={withPrefix(onChange, ["radius"])}
      />
      <BorderEditor
        data={getObj(data, "border")}
        inherited={getObj(inherited, "border")}
        onChange={withPrefix(onChange, ["border"])}
        renderColor={renderColor}
      />
      <EffectField
        value={get(data, "effect")}
        inherited={get(inherited, "effect")}
        effectKeys={effectKeys}
        onChange={(v) => onChange(["effect"], v)}
        onChangeArray={(layers) => onChange(["effect"], layers)}
        renderColor={renderColor}
      />
      <OutlineEditor
        data={getObj(data, "outline")}
        inherited={getObj(inherited, "outline")}
        onChange={withPrefix(onChange, ["outline"])}
        renderColor={renderColor}
      />
    </Section>
  );
}

function EffectField({
  value,
  inherited,
  effectKeys,
  onChange,
  onChangeArray,
  renderColor,
}: {
  value: unknown;
  inherited: unknown;
  effectKeys: readonly string[];
  onChange: (v: unknown) => void;
  onChangeArray: (layers: unknown[]) => void;
  renderColor?: RenderColorFn;
}) {
  const isArray = Array.isArray(value) || (value == null && Array.isArray(inherited));
  const mode: "token" | "stack" = isArray ? "stack" : "token";

  const toggleMode = () => {
    if (mode === "token") {
      // promote token → empty stack
      onChange([]);
    } else {
      onChange(undefined);
    }
  };

  return (
    <>
      <Row
        icon={<EffectIcon />}
        label="Effect"
        right={
          <button
            type="button"
            onClick={toggleMode}
            className="text-[9px] px-1 py-0.5 rounded border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            title={mode === "token" ? "Use inline shadow stack" : "Use named effect token"}
          >
            {mode === "token" ? "→ stack" : "→ token"}
          </button>
        }
      >
        {mode === "token" ? (
          <EffectTokenSelect
            value={str(value)}
            inherited={str(inherited)}
            onChange={onChange}
            effectKeys={effectKeys}
          />
        ) : (
          <span className="text-[10px] text-zinc-500 italic">
            {Array.isArray(value) ? `${value.length} layer${value.length === 1 ? "" : "s"}` : "(inherited stack)"}
          </span>
        )}
      </Row>
      {mode === "stack" && (
        <div className="ml-4">
          <ShadowLayerEditor
            layers={Array.isArray(value) ? value : []}
            path={[]}
            onChange={(_p, v) => onChangeArray(v as unknown[])}
            renderColor={renderColor}
          />
        </div>
      )}
    </>
  );
}
