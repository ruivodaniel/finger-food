import { AccordionSection, hasAnyValue, useMultiExpand } from "./AccordionSection";
import { SurfaceShapeView } from "./SurfaceShapeView";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";

type Rec = Record<string, unknown>;

/**
 * Editor for `TableRowTokens` — the body row element. Same as a regular
 * surface plus an `alternating` slot whose value is a full
 * `SurfaceContainerTokens` applied to `:nth-child(even)` rows.
 *
 * Only `elements.tableRow` uses this shape. All other table-* elements are
 * plain `SurfaceContainerTokens` and route to `SurfaceShapeView` directly.
 */
export function TableRowShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const tokens = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  const ax = useMultiExpand({
    surface: true,
    alternating: hasAnyValue(tokens.alternating),
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
          data={tokens}
          inherited={inh}
          onChange={onChange}
          effectKeys={effectKeys}
        />
      </AccordionSection>

      <AccordionSection
        title="Alternating"
        glyph="⊞"
        expanded={ax.isOpen("alternating")}
        onToggle={() => ax.toggle("alternating")}
      >
        <SurfaceShapeView
          data={(tokens.alternating ?? {}) as Rec}
          inherited={(inh?.alternating as Rec | undefined) ?? undefined}
          onChange={(p, v) => onChange(["alternating", ...p], v)}
          effectKeys={effectKeys}
        />
      </AccordionSection>
    </>
  );
}
