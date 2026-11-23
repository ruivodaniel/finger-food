import { AccordionSection, hasAnyValue, useMultiExpand } from "./AccordionSection";
import { SurfaceShapeView } from "./SurfaceShapeView";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";

type Rec = Record<string, unknown>;

/**
 * Editor for `InteractiveControlTokens` = `{ surface, startIcon, endIcon }`.
 * Three surface accordion sections, primary surface auto-expanded.
 */
export function InteractiveControlShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const tokens = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;

  const startIconHas = hasAnyValue(tokens.startIcon);
  const endIconHas = hasAnyValue(tokens.endIcon);
  const ax = useMultiExpand({
    surface: true,
    startIcon: startIconHas,
    endIcon: endIconHas,
  });

  const slot = (key: "surface" | "startIcon" | "endIcon", title: string) => (
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
      {slot("surface", "Surface")}
      {slot("startIcon", "Start Icon")}
      {slot("endIcon", "End Icon")}
    </>
  );
}
