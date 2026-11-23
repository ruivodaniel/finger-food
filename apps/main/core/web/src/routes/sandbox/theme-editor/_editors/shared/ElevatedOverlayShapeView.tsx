import { AccordionSection, hasAnyValue, useMultiExpand } from "./AccordionSection";
import { SurfaceShapeView } from "./SurfaceShapeView";
import { OverlayShapeView } from "./OverlayShapeView";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";

type Rec = Record<string, unknown>;

/**
 * Editor for `ElevatedOverlayTokens` = `{ surface, overlay }`.
 * Two accordion sections, surface auto-expanded.
 */
export function ElevatedOverlayShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const tokens = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  const ax = useMultiExpand({
    surface: true,
    overlay: hasAnyValue(tokens.overlay),
  });

  return (
    <>
      <AccordionSection
        title="Surface"
        glyph="⊞"
        expanded={ax.isOpen("surface")}
        onToggle={() => ax.toggle("surface")}
      >
        <SurfaceShapeView
          data={(tokens.surface ?? {}) as Rec}
          inherited={(inh?.surface as Rec | undefined) ?? undefined}
          onChange={(p, v) => onChange(["surface", ...p], v)}
          effectKeys={effectKeys}
        />
      </AccordionSection>
      <AccordionSection
        title="Overlay"
        glyph="⊙"
        expanded={ax.isOpen("overlay")}
        onToggle={() => ax.toggle("overlay")}
      >
        <OverlayShapeView
          data={(tokens.overlay ?? {}) as Rec}
          inherited={(inh?.overlay as Rec | undefined) ?? undefined}
          onChange={(p, v) => onChange(["overlay", ...p], v)}
          effectKeys={effectKeys}
        />
      </AccordionSection>
    </>
  );
}
