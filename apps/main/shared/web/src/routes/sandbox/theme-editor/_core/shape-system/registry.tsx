// =============================================================================
// Shape registry — binds shape IDs to React editor components.
//
// This is the single source of truth for "what editor renders for shape X".
// Hand-authored: each entry pairs a `ShapeId` from the type union with a
// component that conforms to `ShapeEditor`.
//
// Most primitive editors take typed-shape props (e.g. `data: ThemeColors`).
// We adapt them to the heterogeneous `ShapeEditorProps` (which uses
// `unknown`) with thin one-line wrappers below.
//
// Shapes not in this map fall through to <UnsupportedShape />.
// =============================================================================

import type {
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeRadius,
  ThemeBorderWidths,
  ThemeEffects,
  ThemeTransitions,
  ThemeIcons,
  ThemeModes,
  GradientDef,
} from "../../../../../../../../../../shared/libs/ui/types";

// Surface views
import { SurfaceShapeView } from "../../_editors/shared/SurfaceShapeView";
import { PartialSurfaceShapeView } from "../../_editors/shared/PartialSurfaceShapeView";
import { SingleSurfaceShapeView } from "../../_editors/shared/SingleSurfaceShapeView";

// Multi-shape entity views
import { ElevatedOverlayShapeView } from "../../_editors/shared/ElevatedOverlayShapeView";
import { InteractiveControlShapeView } from "../../_editors/shared/InteractiveControlShapeView";
import { FieldShapeView } from "../../_editors/shared/FieldShapeView";
import { SwitchShapeView } from "../../_editors/shared/SwitchShapeView";
import { ListContainerShapeView } from "../../_editors/shared/ListContainerShapeView";
import { MediaShapeView } from "../../_editors/shared/MediaShapeView";
import { TableRowShapeView } from "../../_editors/shared/TableRowShapeView";

// Layout shape views
import {
  HeaderScaleShapeView,
  LeftSidebarShapeView,
  SidebarShapeView,
  ContainerScaleShapeView,
  DialogScaleShapeView,
  SheetScaleShapeView,
  ScrollAreaShapeView,
} from "../../_editors/shared/layoutShapeViews";

// Primitive editors
import { ColorsEditor } from "../../_editors/primitives/ColorsEditor";
import { TypographyEditor } from "../../_editors/primitives/TypographyEditor";
import { SpacingEditor } from "../../_editors/primitives/SpacingEditor";
import { RadiusEditor } from "../../_editors/primitives/RadiusEditor";
import { BorderWidthsEditor } from "../../_editors/primitives/BorderWidthsEditor";
import { EffectsEditor } from "../../_editors/primitives/EffectsEditor";
import { TransitionsEditor } from "../../_editors/primitives/TransitionsEditor";
import { IconsEditor } from "../../_editors/primitives/IconsEditor";
import { ThemeModesView } from "../../_editors/primitives/ThemeModesView";
import { GradientsEditor } from "../../_editors/primitives/GradientsEditor";

import type { ShapeId, ShapeEditor } from "./ShapeId";

const REGISTRY: Partial<Record<ShapeId, ShapeEditor>> = {
  // ── Surfaces ────────────────────────────────────────────────
  surfaceContainer: SurfaceShapeView,
  partialSurface: PartialSurfaceShapeView,

  // ── Single-surface families (just unwrap `surface`) ─────────
  interactiveControlGroup: SingleSurfaceShapeView,
  shape: SingleSurfaceShapeView,
  inlineSurface: SingleSurfaceShapeView,

  // ── Multi-shape families ────────────────────────────────────
  elevatedOverlay: ElevatedOverlayShapeView,
  interactiveControl: InteractiveControlShapeView,
  field: FieldShapeView,
  switch: SwitchShapeView,
  listContainer: ListContainerShapeView,
  media: MediaShapeView,
  tableRow: TableRowShapeView,

  // ── Layout shapes ───────────────────────────────────────────
  layoutSurface: SingleSurfaceShapeView,
  layoutHeaderScale: HeaderScaleShapeView,
  layoutLeftSidebar: LeftSidebarShapeView,
  layoutSidebar: SidebarShapeView,
  layoutContainerScale: ContainerScaleShapeView,
  layoutDialogScale: DialogScaleShapeView,
  layoutSheetScale: SheetScaleShapeView,
  layoutScrollArea: ScrollAreaShapeView,

  // ── Theme-root primitives ──────────────────────────────────
  themeColors: ({ data, onChange }) => (
    <ColorsEditor data={data as ThemeColors} onChange={onChange} />
  ),
  themeTypography: ({ data, onChange }) => (
    <TypographyEditor data={data as ThemeTypography} onChange={onChange} />
  ),
  themeSpacing: ({ data, onChange }) => (
    <SpacingEditor data={data as ThemeSpacing} onChange={onChange} />
  ),
  themeRadius: ({ data, onChange }) => (
    <RadiusEditor data={data as ThemeRadius} onChange={onChange} />
  ),
  themeBorderWidths: ({ data, onChange }) => (
    <BorderWidthsEditor data={data as ThemeBorderWidths} onChange={onChange} />
  ),
  themeEffects: ({ data, onChange }) => (
    <EffectsEditor data={data as ThemeEffects} onChange={onChange} />
  ),
  themeTransitions: ({ data, onChange }) => (
    <TransitionsEditor data={data as ThemeTransitions} onChange={onChange} />
  ),
  themeIcons: ({ data, onChange }) => (
    <IconsEditor data={data as ThemeIcons} onChange={onChange} />
  ),
  themeModes: ({ data, onChange }) => (
    <ThemeModesView data={data as ThemeModes} onChange={onChange} />
  ),
  themeGradients: ({ data, onChange }) => (
    <GradientsEditor
      data={(data as Record<string, GradientDef> | undefined) ?? {}}
      onChange={onChange}
    />
  ),
};

export function lookupEditor(shape: ShapeId): ShapeEditor | null {
  return REGISTRY[shape] ?? null;
}
