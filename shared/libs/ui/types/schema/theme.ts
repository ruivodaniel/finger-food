// ============================================================
// THEME SCHEMA — the theme
// What a theme may say, per platform. The elements a theme may address and
// the token shape of each are built from the ELEMENTS table (../elements.ts).
// The types in ../theme.ts, ../cascade.ts and ../platform/*.ts are inferred from here.
// A theme file and a theme row are checked by the same schema: it is the data schema "theme" of the check system (../../rules/system.ts).
// ============================================================
import { z } from "zod";
import { type Platform } from "../axes";
import { ELEMENTS, FAMILY_KEY, type ElementKey, type WebElementKey, type MobileElementKey } from "../elements";
import {
  ColorRef, ThemeColors, ThemeSpacing, ThemeRadius, ThemeEffects, ThemeTransitions, ThemeBorderWidths, ThemeIcons,
  ThemeModes, ThemeTypography, FontWeight, FontStyle,
} from "./primitives";
import { makeTokens, web, mobile, type Tokens } from "./tokens";

// ── L3 — elements: from the table ────────────────────────────

/** the engine reads these on any element: width when expanded, width when [collapsed] */
const collapsedWidths = { widthExpanded: z.string().optional(), widthCollapsed: z.string().optional() };

function makeElements(t: Tokens, platform: Platform) {
  const family = {
    surfaceContainer: [t.SurfaceContainerTokens, t.InlineSurfaceTokens],   // bare, or wrapped in `surface`
    elevatedOverlay: [t.ElevatedOverlayTokens],
    interactiveControl: [t.InteractiveControlTokens],
    interactiveControlGroup: [t.InteractiveControlGroupTokens],
    field: [t.FieldTokens],
    listContainer: [t.ListContainerTokens],
    tableElement: [t.SurfaceContainerTokens],
    shape: [t.ShapeTokens],
    media: [t.MediaTokens],
  };
  /** four elements keep a shape of their own */
  const special: Partial<Record<ElementKey, z.ZodObject[]>> = {
    switch: [t.SwitchTokens],
    separator: [t.SeparatorTokens],
    tableRow: [t.TableRowTokens],
    tableFooterCell: [t.TableRowTokens],
  };
  /** the token shape of one element: its family's (or its own), `sizes` when it has a scale, the collapsed widths */
  const tokensOf = (key: ElementKey) => {
    const row = ELEMENTS[key];
    const shapes: z.ZodObject[] = special[key] ?? family[FAMILY_KEY[row.family]];
    const extra = { ...(row.scale.length ? { sizes: t.SizeTokens.optional() } : {}), ...collapsedWidths };
    const options = shapes.map((s) => s.extend(extra));
    return options.length === 1 ? options[0] : z.union(options);
  };
  const keys = (Object.keys(ELEMENTS) as ElementKey[]).filter((k) => (ELEMENTS[k].platform as readonly Platform[]).includes(platform));
  return z.strictObject(Object.fromEntries(keys.map((k) => [k, tokensOf(k).optional()])));
}

/** any element's tokens, as a type: the schema of each element is the narrower one, built from the table */
type AnyElementTokens = z.infer<
  | Tokens["SurfaceContainerTokens"] | Tokens["InlineSurfaceTokens"] | Tokens["ElevatedOverlayTokens"] | Tokens["InteractiveControlTokens"]
  | Tokens["InteractiveControlGroupTokens"] | Tokens["FieldTokens"] | Tokens["ListContainerTokens"] | Tokens["ShapeTokens"]
  | Tokens["MediaTokens"] | Tokens["SwitchTokens"] | Tokens["SeparatorTokens"] | Tokens["TableRowTokens"]
> & { sizes?: z.infer<Tokens["SizeTokens"]>; widthExpanded?: string; widthCollapsed?: string };
type AnyElement = z.ZodOptional<z.ZodType<AnyElementTokens>>;

export const ElementTypes = makeElements(web, "web") as unknown as z.ZodObject<{ [K in WebElementKey]: AnyElement }, z.core.$strict>;
export const MobileElementTypes = makeElements(mobile, "mobile") as unknown as z.ZodObject<{ [K in MobileElementKey]: AnyElement }, z.core.$strict>;

// ── L4 · L5 · L6 — the cascade ───────────────────────────────

const where = z.partialRecord(z.enum(["emphasis", "status", "state", "scale", "flag", "position"]), z.string());
/** a node named by its key (element, layout or family), by its concept, or by both; `where` adds the axis values it carries */
export const ChainSegment = z.strictObject({
  key: z.string().optional(),
  concept: z.string().optional(),
  where: where.optional(),
});

function makeCascade<E extends z.ZodObject>(t: Tokens, elements: E) {
  /** `self`: the element that carries the concept; every other key: an element or a family inside it */
  const ConceptOverrides = z.record(
    z.string(),
    z.record(z.string(), t.SurfaceContainerTokens.extend({ accent: ColorRef.optional(), contextual: elements.optional() })),
  );
  const ContextualOverrides = z.record(z.string(), elements);
  /** one node chain and the tokens its last node wears */
  const ChainRule = z.strictObject({
    chain: z.tuple([ChainSegment], ChainSegment).readonly(),
    tokens: t.SurfaceContainerTokens,
  });
  /** a condition on one node and what happens to it (`self`) and to the descendants it names (`children`) */
  const GroupedRule = z.strictObject({
    when: ChainSegment,
    self: t.SurfaceContainerTokens.optional(),
    children: z.record(z.string(), t.SurfaceContainerTokens).optional(),
  });
  return { ConceptOverrides, ContextualOverrides, ChainRule, GroupedRule, ThemeRule: z.union([ChainRule, GroupedRule]) };
}
export const cascade = makeCascade(web, ElementTypes);
export const mobileCascade = makeCascade(mobile, MobileElementTypes);

// ── Layout regions, web ──────────────────────────────────────

const breakpoints = z.record(z.string(), z.string()).optional();
// A region carries layout="…" in the DOM; the engine styles it as it styles an element surface. Dimension tokens (widths, heights,
// max-widths) are owned here, not in components. Keys are camelCase; the engine maps them to kebab-case: pageHeader → [layout="page-header"].
/** every region can carry surface tokens. breakpoints: named breakpoints of this region on the viewport, condition name → CSS width
 *  (`hidden` and `stack` are the ones the engine applies today) */
export const LayoutSurface = z.strictObject({ surface: web.SurfaceContainerTokens.optional(), breakpoints });
export const HeightScaleEntry = z.strictObject({ height: z.string() });
export const WidthScaleEntry = z.strictObject({ width: z.string() });
const heights = { sm: HeightScaleEntry.optional(), md: HeightScaleEntry.optional(), lg: HeightScaleEntry.optional() };
const widths = { sm: WidthScaleEntry.optional(), md: WidthScaleEntry.optional(), lg: WidthScaleEntry.optional() };
/** height: the default (no scale attr) */
export const HeaderScaleTokens = LayoutSurface.extend({ height: z.string().optional(), ...heights });
/** width: the default (no scale attr). widthCollapsed: omit to hide entirely on collapse. collapsed: the surface when state="collapsed" */
export const LeftSidebarTokens = LayoutSurface.extend({
  width: z.string().optional(),
  widthCollapsed: z.string().optional(),
  collapsed: LayoutSurface.optional(),
  ...widths,
});
export const SidebarTokens = LayoutSurface.extend({ width: z.string().optional(), ...widths });
// the main container: the max-width of each named scale. `full` is no constraint and needs no token
export const ContainerScaleEntry = z.strictObject({ maxWidth: z.string() });
export const ContainerTokens = z.strictObject({
  xs: ContainerScaleEntry.optional(),
  sm: ContainerScaleEntry.optional(),
  md: ContainerScaleEntry.optional(),
  lg: ContainerScaleEntry.optional(),
  xl: ContainerScaleEntry.optional(),
});
// physical dimensions of the elevated overlays; their visual tokens stay in elements (dialog, drawer). A sheet's size: width for side sheets, height for bottom sheets
export const DialogScaleEntry = z.strictObject({ maxWidth: z.string() });
export const SheetScaleEntry = z.strictObject({ size: z.string() });
export const DialogScaleTokens = z.strictObject({ sm: DialogScaleEntry.optional(), md: DialogScaleEntry.optional(), lg: DialogScaleEntry.optional() });
export const SheetScaleTokens = z.strictObject({
  sm: SheetScaleEntry.optional(),
  md: SheetScaleEntry.optional(),
  lg: SheetScaleEntry.optional(),
  full: SheetScaleEntry.optional(),
});

const region = LayoutSurface.optional(), header = HeaderScaleTokens.optional();
export const ThemeLayouts = z.strictObject({
  // the default of every region (as L2 is for elements)
  surface: web.SurfaceContainerTokens.optional(),
  // a region's shade over its own base (fills + text), on any region carrying emphasis="…"; the region's own rule keeps its border edge
  emphasis: z.strictObject({ primary: region, secondary: region }).optional(),
  shell: region,
  shellTopNav: region,
  shellSideNav: region,
  shellNone: region,
  // the nav col child inside shell-side-nav
  shellNav: SidebarTokens.optional(),
  page: region,
  pageHeader: header,
  // a second full-width row under the page header (e.g. the tabs)
  secondPageHeader: header,
  pageBody: region,
  main: region,
  mainHeader: header,
  secondMainHeader: header,
  // invisible row holding main-body + main-right-sidebar
  mainContent: region,
  mainBody: region,
  mainFooter: header,
  // a full-width row under page-body, below both page sidebars and main
  pageFooter: header,
  // sidebars, by zone: the page's two columns beside main, main's own right column
  pageLeftSidebar: LeftSidebarTokens.optional(),
  pageRightSidebar: SidebarTokens.optional(),
  mainRightSidebar: SidebarTokens.optional(),
  // the reading measure inside main-body
  mainContainer: ContainerTokens.optional(),
  // scrollbar appearance only (structure is in the component)
  scrollArea: z.strictObject({ scrollbar: web.ScrollbarTokens.optional() }).optional(),
  section: region,
  rowSection: region,
  colSection: region,
  dialog: DialogScaleTokens.optional(),
  sheet: SheetScaleTokens.optional(),
});

// ── What only a phone has ────────────────────────────────────

/** the edges of the device a region keeps clear of (the status bar, the home indicator, the notch) */
export const SafeAreaEdge = z.enum(["top", "bottom", "left", "right"]);
export const MobileRegionTokens = z.strictObject({
  surface: mobile.SurfaceContainerTokens.optional(),
  safeArea: z.array(SafeAreaEdge).readonly().optional(),
});
export const MobileBarTokens = MobileRegionTokens.extend({ height: z.string().optional(), ...heights });
const mobileRegion = MobileRegionTokens.optional(), bar = MobileBarTokens.optional();
export const MobileLayouts = z.strictObject({
  surface: mobile.SurfaceContainerTokens.optional(),
  /** the whole screen */
  screen: mobileRegion,
  /** the bar at the top: a title with its actions, a back button, or cancel and save */
  appBar: bar,
  /** the content, the one region that scrolls */
  body: mobileRegion,
  /** a bar fixed above the tab bar, for the screen's main action */
  actionBar: bar,
  /** the navigation at the bottom */
  tabBar: bar,
  /** the panel that slides in from the side */
  drawer: MobileRegionTokens.extend({ width: z.string().optional() }).optional(),
  dialog: DialogScaleTokens.optional(),
  sheet: SheetScaleTokens.optional(),
});

export const MobilePress = z.strictObject({
  /** the opacity of a pressed element (iOS) */
  opacityDim: z.number().optional(),
  /** the ripple of a pressed element (Android) */
  ripple: z.strictObject({ color: ColorRef.optional(), borderless: z.boolean().optional() }).optional(),
});

// a phone loads no font by URL: the files ship in the app (`asset`: the font file in the app's assets)
export const FontSourceBundled = z.strictObject({
  type: z.literal("bundled"),
  faces: z.array(z.strictObject({ weight: FontWeight, style: FontStyle.optional(), asset: z.string() })),
});
export const MobileTypography = ThemeTypography.extend({ fontSources: z.record(z.string(), FontSourceBundled).optional() });

// ── The theme ────────────────────────────────────────────────

const core = {
  id: z.string(),
  name: z.string(),
  /** version + fidelity live on the theme; the folder <name>/v<version> mirrors them */
  version: z.number().optional(),
  type: z.enum(["wireframe", "high-fidelity"]).optional(),
  kind: z.enum(["seed", "product"]).optional(),
  /** named gradients (referenced as "gradient-NAME" in background tokens) */
  gradients: z.record(z.string(), web.GradientDef).optional(),
  colors: ThemeColors,
  spacing: ThemeSpacing,
  radius: ThemeRadius,
  effects: ThemeEffects,
  transitions: ThemeTransitions,
  borderWidths: ThemeBorderWidths,
  icons: ThemeIcons.optional(),
  modes: ThemeModes,
};
export const ThemeCore = z.strictObject(core);

// ── Density: multipliers, all the theme's ─────────────────────
/** a factor for every kind (a number), or one per kind: `all` is what a kind left out takes; 1 when neither is there */
const DensityFactors = z.union([z.number(), z.strictObject({ all: z.number().optional(), spacing: z.number().optional(), gap: z.number().optional(), font: z.number().optional(), icon: z.number().optional(), width: z.number().optional(), height: z.number().optional() })]);
export const ThemeDensity = z.strictObject({
  /** the factor the theme starts from; absent: 1 */
  theme: DensityFactors.optional(),
  /** the density modes the user can pick, an axis beside the colour mode; the host sets one on the root (data-density) */
  modes: z.record(z.string(), DensityFactors).optional(),
  /** the factor of an element, by its element attribute (surface--table) */
  elements: z.record(z.string(), DensityFactors).optional(),
  /** the factor of a concept, by its name; markup names the concept and knows nothing of this */
  concepts: z.record(z.string(), DensityFactors).optional(),
});

/** A theme for the web. `platform` absent means web. */
export const WebTheme = z.strictObject({
  ...core,
  platform: z.literal("web").optional(),
  typography: ThemeTypography,
  families: web.MorphologicalFamilies,
  elements: ElementTypes,
  concepts: cascade.ConceptOverrides.optional(),
  contextual: cascade.ContextualOverrides.optional(),
  rules: z.array(cascade.ThemeRule).optional(),
  /** named keyframes (referenced by an animation token's `name`): name → step ("from", "to" or a percentage) → CSS property in camelCase → value */
  keyframes: z.record(z.string(), z.record(z.string(), z.record(z.string(), z.string()))).optional(),
  /** the density of the theme, by level (spike; a theme that has none emits none) */
  density: ThemeDensity.optional(),
  /** the document body: the ground every screen stands on, same surface vocabulary as a layout */
  body: z.strictObject({ surface: web.SurfaceContainerTokens }).optional(),
  layouts: ThemeLayouts.optional(),
});

/** A theme for mobile: the same levels, in mobile's shapes, plus what only a phone has. */
export const MobileTheme = z.strictObject({
  ...core,
  platform: z.literal("mobile"),
  typography: MobileTypography,
  families: mobile.MorphologicalFamilies,
  elements: MobileElementTypes,
  concepts: mobileCascade.ConceptOverrides.optional(),
  contextual: mobileCascade.ContextualOverrides.optional(),
  rules: z.array(mobileCascade.ChainRule).optional(),
  layouts: MobileLayouts.optional(),
  press: MobilePress.optional(),
});

/** the schema of a theme, by the platform it says */
export const themeSchema = (theme: unknown) =>
  (theme as { platform?: unknown } | null)?.platform === "mobile" ? MobileTheme : WebTheme;

export { makeTokens };
