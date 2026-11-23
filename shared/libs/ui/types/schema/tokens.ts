// ============================================================
// THEME SCHEMA — tokens
// The token shapes of a surface and of each family, for one platform.
// The web's are the reference: the types in ../families.ts, ../cascade.ts
// and ../platform/web.ts are inferred from `web`. Mobile's are the same
// shapes without the web-only keys (cursor, scrollbar, outline) and with
// mobile's states; their types are MobileTokens<…> of the web's.
// ============================================================
import { z } from "zod";
import { EMPHASIS, STATUS, STATE, STATE_MOBILE, SIBLING, type Platform } from "../axes";
import {
  ColorRef, SpacingToken, RadiusToken, EffectToken, EffectLayer, TextEffectLayer, BorderWidthToken, BorderStyleToken,
  TypographyTypeKey, TransitionDurationToken, TransitionTimingToken, Scale,
} from "./primitives";

export const CursorToken = z.enum([
  "auto", "default", "none", "pointer", "wait", "text",
  "move", "not-allowed", "crosshair", "grab", "grabbing",
  "help", "progress", "cell", "copy", "alias",
  "context-menu", "vertical-text", "no-drop", "all-scroll",
  "col-resize", "row-resize",
  "n-resize", "s-resize", "e-resize", "w-resize",
  "ne-resize", "nw-resize", "se-resize", "sw-resize",
  "ew-resize", "ns-resize", "nesw-resize", "nwse-resize",
  "zoom-in", "zoom-out",
]);

export const SeparatorDimension = z.union([z.enum(["fill", "none"]), z.templateLiteral([z.number(), "px"])]);
export const ChildAlignValue = z.enum(["start", "center", "end", "stretch", "baseline"]);

/** a tint: a colour, or a colour with an opacity (0 to 1) */
export const TintToken = z.union([ColorRef, z.strictObject({ color: ColorRef, opacity: z.number().min(0).max(1).optional() })]);

export function makeTokens(platform: Platform) {
  const web = platform === "web";
  /** keys only the web has: in the type always (the type is the web's), in the schema on the web only */
  const webOnly = <T extends z.ZodRawShape>(shape: T): T => (web ? shape : ({} as T));

  const AnimationTokens = z.strictObject({
    name: z.string().optional(),
    duration: z.string().optional(),
    timing: z.string().optional(),
    iterationCount: z.string().optional(),
    direction: z.enum(["normal", "alternate", "reverse", "alternate-reverse"]).optional(),
    fillMode: z.enum(["none", "forwards", "backwards", "both"]).optional(),
  });

  const side = { width: BorderWidthToken.optional(), style: BorderStyleToken.optional(), color: ColorRef.optional() };
  const BorderSideTokens = z.strictObject(side);
  const BorderTokens = z.strictObject({
    ...side,
    top: BorderSideTokens.optional(),
    right: BorderSideTokens.optional(),
    bottom: BorderSideTokens.optional(),
    left: BorderSideTokens.optional(),
  });

  const RadiusTokens = z.strictObject({
    all: RadiusToken.optional(),
    topLeft: RadiusToken.optional(),
    topRight: RadiusToken.optional(),
    bottomRight: RadiusToken.optional(),
    bottomLeft: RadiusToken.optional(),
  });

  const margin = z.union([SpacingToken, z.literal("auto")]).optional();
  const MarginTokens = z.strictObject({ all: margin, x: margin, y: margin, top: margin, right: margin, bottom: margin, left: margin });

  const OutlineTokens = z.strictObject({ ...side, offset: z.string().optional() });
  const ScrollbarTokens = z.strictObject({
    thumbColor: ColorRef.optional(),
    trackColor: ColorRef.optional(),
    width: z.string().optional(),
  });

  const BoundaryTokens = z.strictObject({
    border: BorderTokens.optional(),
    radius: RadiusTokens.optional(),
    effect: z.union([EffectToken, z.array(EffectLayer)]).optional(),
    ...webOnly({ outline: OutlineTokens.optional() }),
    margin: MarginTokens.optional(),
  });

  const pad = SpacingToken.optional();
  const PaddingTokens = z.strictObject({
    all: pad, x: pad, y: pad, top: pad, right: pad, bottom: pad, left: pad,
    /** this padding is bled by the part zones and child containers (a surface, a list, a table, a stack): they run to this element's
     *  inner edge on the edges their position gives them, the corners following this element's radius; a part's own smartBleed: false
     *  opts out. A leaf, a control, a field, a media box never bleed: they sit inside a part */
    childrenSmartBleed: z.boolean().optional(),
    /** this part bleeds its parent's padding, or not (false opts out of the parent's childrenSmartBleed). The parent is read from the DOM,
     *  never named */
    smartBleed: z.boolean().optional(),
  });

  const GapTokens = z.strictObject({ all: pad, h: pad, v: pad });

  const GradientStop = z.strictObject({ color: z.union([ColorRef, z.literal("transparent")]), position: z.string().optional() });
  const GradientLayer = z.discriminatedUnion("type", [
    z.strictObject({ type: z.literal("linear"), angle: z.union([z.number(), z.string()]), stops: z.array(GradientStop) }),
    z.strictObject({ type: z.literal("radial"), shape: z.enum(["circle", "ellipse"]).optional(), position: z.string().optional(), stops: z.array(GradientStop) }),
    z.strictObject({ type: z.literal("conic"), angle: z.number().optional(), position: z.string().optional(), stops: z.array(GradientStop) }),
  ]);
  // A gradient definition is either a single layer or a stack of layers.
  // Stacked layers are emitted as comma-separated CSS background values:
  // the standard technique for mesh/blob effects using multiple radial-gradients.
  const GradientDef = z.union([GradientLayer, z.array(GradientLayer)]);

  // Works for both flex containers (justify-content / align-items) and block text (text-align / vertical-align).
  // horizontal: text-align for block, justify-content for flex-row, align-items for flex-col
  // vertical: align-items for flex-row, justify-content for flex-col
  const ChildAlignTokens = z.strictObject({ horizontal: ChildAlignValue.optional(), vertical: ChildAlignValue.optional() });

  const InteriorTokens = z.strictObject({
    background: z.union([ColorRef, GradientDef]).optional(),
    backgroundAlpha: z.number().optional(),
    foreground: ColorRef.optional(),
    padding: PaddingTokens.optional(),
    opacity: z.number().optional(),
    ...webOnly({ scrollbar: ScrollbarTokens.optional() }),
    gap: GapTokens.optional(),
    /** a separator holds a surface, and a surface an interior: the one place the shapes nest into themselves, so its type is named */
    get separator(): z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"none">, z.ZodType<Separator>]>> {
      return z.union([z.literal("none"), SeparatorTokens]).optional();
    },
    childAlign: ChildAlignTokens.optional(),
  });

  // The typography a surface uses for its own text content: a pointer to a root type scale and/or text treatments.
  // Does NOT own color: color comes from interior.foreground.
  const TypographyTokens = z.strictObject({
    typographyType: TypographyTypeKey.optional(),
    textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    verticalAlign: z.enum(["top", "middle", "bottom", "baseline"]).optional(),
    textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional(),
    textDecoration: z.enum(["none", "underline", "line-through"]).optional(),
    textEffect: z.array(TextEffectLayer).optional(),
  });

  const TransitionTokens = z.strictObject({ property: z.string().optional(), duration: TransitionDurationToken.optional(), timing: TransitionTimingToken.optional() });

  const DimensionPositionTokens = z.strictObject({
    width: z.string().optional(),
    height: z.string().optional(),
    translateX: z.string().optional(),
    translateY: z.string().optional(),
  });

  /** everything a surface says but `combined` */
  const partialSurface = {
    boundary: BoundaryTokens.optional(),
    interior: InteriorTokens.optional(),
    dimensionPosition: DimensionPositionTokens.optional(),
    defaultTypography: TypographyTokens.optional(),
    /** a colour the element is washed with, or `{color, opacity}`: the same colour at a strength (a state's tint stacks over a status's) */
    tint: TintToken.optional(),
    ...webOnly({ cursor: CursorToken.optional() }),
    /** @deprecated moved under interior.padding.smartBleed (5 Nov 2026); read until the first test document is moved, then sunset */
    smartBleed: z.boolean().optional(),
    transition: TransitionTokens.optional(),
    /** a named animation (see the theme's keyframes) the element runs */
    animation: AnimationTokens.optional(),
    /** named breakpoints of this element as a container: condition name → CSS width. The markup names the condition
     *  (a Stack's `when`), the theme gives it the width, the engine compiles a container query. Never a position. */
    breakpoints: z.record(z.string(), z.string()).optional(),
    /** CSS variables a component reads by name, emitted on this selector: the charts' palette (`--chart-series-1`) and ink. A value naming a theme colour resolves to it. */
    vars: z.record(z.string(), z.string()).optional(),
  };
  const PartialSurfaceTokens = z.strictObject(partialSurface);

  const webState = z.enum(["default", ...STATE]);
  const StateKey = web ? webState : (z.enum(["default", ...STATE_MOBILE]) as unknown as typeof webState);
  const CombinedWhere = z.strictObject({
    state: StateKey.optional(),
    status: z.enum(STATUS).optional(),
    emphasis: z.enum(EMPHASIS).optional(),
    /** the theme key stays `position` (authored in themes); its values are the sibling order */
    position: z.enum(SIBLING).optional(),
  });
  const CombinedEntry = z.strictObject({
    where: CombinedWhere,
    partialSurface: PartialSurfaceTokens.optional(),
    transition: TransitionTokens.optional(),
    animation: AnimationTokens.optional(),
  });

  const SurfaceContainerTokens = z.strictObject({ ...partialSurface, combined: z.array(CombinedEntry).optional() });
  const surface = SurfaceContainerTokens.optional();

  interface Separator {
    surface?: z.infer<typeof SurfaceContainerTokens>;
    height?: z.infer<typeof SeparatorDimension>;
    width?: z.infer<typeof SeparatorDimension>;
  }
  const SeparatorTokens = z.strictObject({
    surface,
    height: SeparatorDimension.optional(),
    width: SeparatorDimension.optional(),
  });

  const OverlayTokens = z.strictObject({
    scrimColor: ColorRef.optional(),
    scrimOpacity: z.number().optional(),
    scrimBlur: z.string().optional(),
    entranceAnimation: AnimationTokens.optional(),
    exitAnimation: AnimationTokens.optional(),
  });

  const ElevatedOverlayTokens = z.strictObject({ surface, overlay: OverlayTokens.optional() });
  const ListContainerTokens = z.strictObject({
    surface,
    row: surface,
    cell: surface,
    separator: SeparatorTokens.optional(),
    alternating: surface,
  });
  const InteractiveControlTokens = z.strictObject({ surface, startIcon: surface, endIcon: surface });
  // two surfaces: the track (the pill, changes on checked/unchecked) and the thumb (the sliding circle)
  const SwitchTokens = z.strictObject({ track: surface, thumb: surface });
  const InteractiveControlGroupTokens = z.strictObject({ surface });
  const FieldTokens = z.strictObject({
    surface,
    startIcon: surface,
    endIcon: surface,
    placeholderColor: ColorRef.optional(),
    placeholderOpacity: z.number().optional(),
    obfuscation: z.strictObject({
      character: z.string().optional(),
      letterSpacing: z.string().optional(),
      fontSize: z.string().optional(),
    }).optional(),
    caretColor: ColorRef.optional(),
  });
  // badge, avatar, spinner, skeleton, progress: the same `surface` wrapper as the other families
  const InlineSurfaceTokens = z.strictObject({ surface });
  const ShapeTokens = z.strictObject({ surface });
  const MediaTokens = z.strictObject({
    surface,
    objectFit: z.enum(["cover", "contain", "fill", "none", "scale-down"]).optional(),
    objectPosition: z.string().optional(),
    aspectRatio: z.string().optional(),
    overlay: z.strictObject({ color: ColorRef.optional(), opacity: z.number().optional(), blur: z.string().optional() }).optional(),
    filter: z.strictObject({
      grayscale: z.number().optional(),
      brightness: z.number().optional(),
      contrast: z.number().optional(),
      blur: z.string().optional(),
    }).optional(),
  });
  // a table row extends the surface with an optional alternating-row override
  const TableRowTokens = SurfaceContainerTokens.extend({ alternating: surface });

  const IconSizeRef = z.union([Scale, z.literal("inherit")]);
  const SizeEntry = z.strictObject({
    partialSurface: PartialSurfaceTokens.optional(),
    icon: z.strictObject({ size: IconSizeRef.optional(), weight: z.number().optional() }).optional(),
  });
  const SizeTokens = z.partialRecord(Scale, SizeEntry);
  // A family may author a `sizes` block: per-scale defaults every element in the family inherits (padding, typography, icon size…).
  // Elements override with their own `sizes` on more specific selectors.
  const sizes = { sizes: SizeTokens.optional() };

  const MorphologicalFamilies = z.strictObject({
    surfaceContainer: SurfaceContainerTokens.extend(sizes).optional(),
    elevatedOverlay: ElevatedOverlayTokens.extend(sizes).optional(),
    listContainer: ListContainerTokens.extend(sizes).optional(),
    interactiveControl: InteractiveControlTokens.extend(sizes).optional(),
    interactiveControlGroup: InteractiveControlGroupTokens.extend(sizes).optional(),
    field: FieldTokens.extend(sizes).optional(),
    shape: ShapeTokens.extend(sizes).optional(),
    media: MediaTokens.extend(sizes).optional(),
  });

  return {
    AnimationTokens, BorderSideTokens, BorderTokens, RadiusTokens, MarginTokens, OutlineTokens, ScrollbarTokens, BoundaryTokens,
    PaddingTokens, GapTokens, GradientStop, GradientLayer, GradientDef, ChildAlignTokens, InteriorTokens, TypographyTokens,
    TransitionTokens, DimensionPositionTokens, PartialSurfaceTokens, StateKey, CombinedWhere, CombinedEntry, SurfaceContainerTokens,
    SeparatorTokens, OverlayTokens, ElevatedOverlayTokens, ListContainerTokens, InteractiveControlTokens, SwitchTokens,
    InteractiveControlGroupTokens, FieldTokens, InlineSurfaceTokens, ShapeTokens, MediaTokens, TableRowTokens, IconSizeRef,
    SizeEntry, SizeTokens, MorphologicalFamilies,
  };
}

export const web = makeTokens("web");
export const mobile = makeTokens("mobile");
export type Tokens = typeof web;
