import { SurfaceEditor } from "./SurfaceEditor";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";

type Rec = Record<string, unknown>;

/**
 * Editor for `PartialSurfaceTokens` — `Omit<SurfaceContainerTokens, 'states'|'status'|'emphasis'>`.
 *
 * Same body as SurfaceShapeView (Boundary/Interior/Typography/Misc) but
 * WITHOUT the override pill bar — partial surfaces don't have axes.
 *
 * Used inside listContainer's row/header/cell/alternating, inside SizeEntry,
 * and anywhere PartialSurface appears.
 */
export function PartialSurfaceShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  return (
    <SurfaceEditor
      data={(data ?? {}) as Rec}
      inherited={(inherited as Rec | undefined) ?? undefined}
      onChange={onChange}
      effectKeys={effectKeys}
    />
  );
}
