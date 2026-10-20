import { AccordionSection, hasAnyValue, useMultiExpand } from "./AccordionSection";
import { SurfaceShapeView } from "./SurfaceShapeView";
import { PartialSurfaceShapeView } from "./PartialSurfaceShapeView";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";

type Rec = Record<string, unknown>;

/**
 * Editor for `ListContainerTokens`:
 *   { surface, separator? }.
 *
 * Table parts (header / headerCell / row / cell / alternating / footer) used
 * to live nested under this shape. They're now first-class flat element keys
 * (`elements.tableRoot`, `elements.tableHeader`, …) — see TableRowShapeView
 * for the one element that has its own composite shape.
 *
 * `separator` nests a surface inside it — render that surface only for now.
 */
export function ListContainerShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const tokens = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  const ax = useMultiExpand({
    surface: true,
    separator: hasAnyValue(tokens.separator),
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
        title="Separator"
        glyph="⊟"
        expanded={ax.isOpen("separator")}
        onToggle={() => ax.toggle("separator")}
      >
        <PartialSurfaceShapeView
          data={
            ((getRec(tokens, "separator")?.surface as Rec | undefined) ?? {}) as Rec
          }
          inherited={
            (getRec(inh, "separator")?.surface as Rec | undefined) ?? undefined
          }
          onChange={(p, v) => onChange(["separator", "surface", ...p], v)}
          effectKeys={effectKeys}
        />
      </AccordionSection>
    </>
  );
}

function getRec(
  source: Rec | undefined,
  key: string,
): Rec | undefined {
  if (!source) return undefined;
  const v = source[key];
  return v && typeof v === "object" ? (v as Rec) : undefined;
}
