import { AccordionSection, hasAnyValue, useMultiExpand } from "./AccordionSection";
import { SurfaceShapeView } from "./SurfaceShapeView";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";

type Rec = Record<string, unknown>;

/**
 * Editor for `SwitchTokens` = `{ track, thumb }`.
 * Two parallel surfaces, no clear primary — both equal weight.
 * Track is expanded by default; user toggles to thumb.
 */
export function SwitchShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const tokens = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  const trackHas = hasAnyValue(tokens.track);
  const thumbHas = hasAnyValue(tokens.thumb);
  const ax = useMultiExpand({
    track: trackHas || (!trackHas && !thumbHas),
    thumb: thumbHas,
  });

  const slot = (key: "track" | "thumb", title: string) => (
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
      {slot("track", "Track")}
      {slot("thumb", "Thumb")}
    </>
  );
}
