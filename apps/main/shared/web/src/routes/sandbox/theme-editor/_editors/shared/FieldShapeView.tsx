import { AccordionSection, hasAnyValue, useMultiExpand } from "./AccordionSection";
import { SurfaceShapeView } from "./SurfaceShapeView";
import { Section } from "./Section";
import { Row } from "./Row";
import { ColorField } from "./ColorField";
import { NumberField } from "./NumberField";
import { ObfuscationView } from "./ObfuscationView";
import { get, getObj, num, str } from "./_types";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";

type Rec = Record<string, unknown>;

/**
 * Editor for `FieldTokens`. Three surfaces (surface / startIcon / endIcon)
 * + a flat "Other Properties" section for the loose primitives
 * (placeholderColor, placeholderOpacity, caretColor, obfuscation).
 */
export function FieldShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const tokens = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  const ax = useMultiExpand({
    surface: true,
    startIcon: hasAnyValue(tokens.startIcon),
    endIcon: hasAnyValue(tokens.endIcon),
  });

  const surfaceSlot = (
    key: "surface" | "startIcon" | "endIcon",
    title: string,
  ) => (
    <AccordionSection
      title={title}
      glyph="⊞"
      expanded={ax.isOpen(key)}
      onToggle={() => ax.toggle(key)}
    >
      <SurfaceShapeView
        data={(tokens[key] ?? {}) as Rec}
        inherited={(inh?.[key] as Rec | undefined) ?? undefined}
        onChange={(p, v) => onChange([key, ...p], v)}
        effectKeys={effectKeys}
      />
    </AccordionSection>
  );

  return (
    <>
      {surfaceSlot("surface", "Surface")}
      {surfaceSlot("startIcon", "Start Icon")}
      {surfaceSlot("endIcon", "End Icon")}

      <Section title="Other Properties">
        <Row label="placeh. col">
          <ColorField
            mode="token"
            value={str(get(tokens, "placeholderColor"))}
            inherited={str(get(inh, "placeholderColor"))}
            onChange={(v) => onChange(["placeholderColor"], v)}
          />
        </Row>
        <Row label="placeh. op">
          <NumberField
            value={num(get(tokens, "placeholderOpacity"))}
            inherited={num(get(inh, "placeholderOpacity"))}
            onChange={(v) => onChange(["placeholderOpacity"], v)}
            step={0.05}
            min={0}
            max={1}
          />
        </Row>
        <Row label="caret col">
          <ColorField
            mode="token"
            value={str(get(tokens, "caretColor"))}
            inherited={str(get(inh, "caretColor"))}
            onChange={(v) => onChange(["caretColor"], v)}
          />
        </Row>
        <ObfuscationView
          data={getObj(tokens, "obfuscation")}
          inherited={getObj(inh, "obfuscation")}
          onChange={(p, v) => onChange(["obfuscation", ...p], v)}
        />
      </Section>
    </>
  );
}
