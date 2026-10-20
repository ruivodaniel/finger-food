import { SurfaceShapeView } from "./SurfaceShapeView";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";

type Rec = Record<string, unknown>;

/**
 * Adapter for families whose data shape is just `{ surface: SurfaceContainerTokens }`.
 * (interactiveControlGroup, shape, inlineSurface — and any future single-surface family.)
 *
 * Unwraps the `surface` envelope and forwards to `SurfaceShapeView` so the
 * user gets the standard surface editor (with pill bar, override scoping,
 * etc.) without an unnecessary outer accordion section.
 */
export function SingleSurfaceShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const tokens = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  return (
    <SurfaceShapeView
      data={(tokens.surface ?? {}) as Rec}
      inherited={(inh?.surface as Rec | undefined) ?? undefined}
      onChange={(p, v) => onChange(["surface", ...p], v)}
      effectKeys={effectKeys}
    />
  );
}
