# Theme Color System — Proposed Evolution

Status: proposed. Nothing here is implemented yet.

## Purpose

Create a consistent, expressive color system that supports rich content palettes and unlimited appearance modes without requiring individual renderers to manage color adaptation.

**Core principle:** Every mode's foreground and background define the tonal boundaries for all derived colors. This ensures visual coherence even in low-contrast or unconventional modes. Designers retain full control through explicit overrides, while the engine automatically derives everything else.

## 1. Color Palettes

| Palette | Definition | Theme settable | Mode derivable |
|---|---|---|---|
| `main` | White/black named foundations | Mandatory | No |
| `brand` | Four brand source colors | Mandatory | No |
| `status` | Success, info, warning, error | Mandatory | Yes |
| `grayscale` | 13-step mode-based tonal scale, 50–950 | Optional | Yes |
| `brandGrayscale` | Brand-tinted tonal scale, per brand color | Optional | Yes |
| `content` | 25 Radix hues × `standard` / `soft` | Mandatory | Yes |
| `custom` | Arbitrary named colors | Optional | Yes |

**Universal rule:** Every derivable color supports explicit theme-authored values and per-mode overrides. Missing values are generated automatically.

`main` and `brand` sources are immutable. Generated brand tints remain derivable, without constituting another palette.

## 2. Content Vocabulary

25 named hues, each with two independently authored colors: `standard` and `soft` (**50 source colors per theme**).

| Family | Hues |
|---|---|
| Red | Tomato, Red, Ruby, Crimson |
| Pink | Pink, Plum |
| Purple | Purple, Violet, Iris |
| Blue | Indigo, Blue, Sky |
| Cyan | Cyan, Teal |
| Green | Jade, Green, Grass, Mint, Lime |
| Yellow | Yellow, Amber |
| Orange | Orange |
| Earth | Brown, Bronze, Gold |

## 2b. Standard and Soft are roles

| Variant | Role | Typical use |
|---|---|---|
| `standard` | The theme's primary, expressive version of a hue. | Shapes, markers, prominent elements |
| `soft` | A lower-emphasis expression of the same hue, subordinate to `standard`. | Notes, subtle fills, coloured backgrounds, highlights |

- **Pastel is an aesthetic; Soft is a role.** The only universal constraint: in the same mode, `soft` has lower visual emphasis than `standard`, that is, it sits closer to the mode's background (OKLCH distance). Tested in every mode, including arbitrary ones.
- No fixed lightness, chroma or contrast difference is imposed. Each theme controls the distance: Swiss may keep the two very close; Pop makes `soft` distinctly pastel.
- Both are authored independently; the mode engine adapts both against the mode's BG/FG.

### Per-theme criteria (draft, to be corrected)

`curve` is the dark-mode / derived-mode `{saturationFactor, gamma}`.

| Theme | Standard | Soft | Distance | curve |
|---|---|---|---|---|
| swiss | flat, saturated, narrow chroma range | same hue, barely lighter; never pastel | very small | 1.0 / 1.0 |
| brutalist | loud, fully saturated | still loud (acid-like), only lighter | small | 1.0 / 1.0 |
| wireframes | raw spectrum hues, pure | plain tint of the same hue | medium | 1.0 / 1.0 |
| pop | vibrant but chalky, warm | distinctly pastel (solid pastel blocks) | large | 0.9 / 0.9 |
| breeze | bright, airy | ice-pale pastel | large | 0.85 / 1.0 |
| sketch | muted marker | paper-pale pastel | large | 0.8 / 1.0 |
| honey | warm, amber-saturated | cream / honey pale | medium-large | 0.9 / 1.0 |
| lilac | saturated, violet-leaning cool | lavender-pale | medium-large | 0.95 / 1.0 |
| liquid | pastel-ish glass | very pale glow | medium | 0.85 / 1.0 |
| editorial | print ink, desaturated | paper-tinted | medium | 0.75 / 1.1 |
| borro | dusty, muted cool (Soft Glow) | pale cool | medium | 0.8 / 1.0 |
| bounx | earthy mid, warm paper | the prototype's soft tints | medium | 0.9 / 1.0 |
| wireframe-stroke (dAInta) | restrained, purple-grey leaning | pale | small-medium, narrow range | 0.8 / 1.1 |

Copies and twins follow their source: `bounx-test` = bounx, `bounx-mobile` = bounx, `wireframe-stroke-mobile` = wireframe-stroke.

## 3. Mode Derivation Criteria

Each mode has its own `background`, `foreground`, and derivation parameters. Both anchors accept color references or literal values, including chromatic colors.

| Palette | Derivation criteria |
|---|---|
| `grayscale` | Non-linear weighted interpolation between mode BG and FG. Preserve existing step weights: 2%, 5%, 7%, 10%, 14%, 18%, 35%, 50%, 65%, 76%, 86%, 93%, 96%. |
| `brandGrayscale` | **Same BG→FG baseline and non-linear steps as grayscale**, with brand-color tinting applied within that range. The resulting tonal/lightness values must remain bounded by the mode's BG and FG, never exceeding their contrast range. |
| `status` | Preserve semantic hue. Adapt perceptual lightness according to mode BG/FG and adjust chroma according to mode saturation. Check contrast against intended surfaces. |
| `content` | Preserve authored hue and relative saturation differences across all 50 colors. Remap lightness against mode BG/FG and apply a mode-defined chroma curve to the authored saturation spectrum. |
| `custom` | Same adaptation as content, using the shared theme chroma transformation. |

### Chromatic derivation

Use OKLCH for chromatic transformations:

- **Hue (H):** preserved whenever possible.
- **Lightness (L):** mapped from the reference mode's BG/FG lightness interval to the target mode's interval.
- **Chroma (C):** transformed proportionally through a configurable curve:

`C′ = Cmax × saturationFactor × (C / Cmax) ^ gamma`

Where `Cmax` is the maximum authored chroma in the adaptive content/custom spectrum; `saturationFactor` controls overall saturation, and `gamma` controls the curve. Clamp to the target color gamut.

This preserves relative chroma ordering and allows narrow or wide saturation differences within a theme.

`brand-N-light|dark` and `status-X-light|dark` are retired, with their `brandLightAmount`, `brandDarkAmount`, `statusLightAmount` and `statusDarkAmount` parameters. The rule, applied mechanically to every theme: a `-light` is a `tint` of the plain colour (a `background` becomes transparent with `tint: <colour>`; a border colour likewise; a gradient stop becomes the colour at 20% over transparent), and a `-dark` is the plain brand or status colour.

## 4. Type Structure

Preserve the existing ability to use literal colors or token references.

```typescript
type ColorValue = string;
// e.g. "#E30613", "brand-1", "status-error"
// Existing resolver also supports CSS color functions.

type ModeOverrides =
  Partial<Record<ModeName, ColorValue>>;

type AuthoredColor =
  | ColorValue
  | {
      value: ColorValue;
      modes?: ModeOverrides;
    };

type GeneratedColor = {
  value?: ColorValue;
  modes?: ModeOverrides;
};

type ContentHue = {
  standard: AuthoredColor;
  soft: AuthoredColor;
};
```

Palette structure:

```typescript
colors: {
  main: Record<MainKey, ColorValue>;
  brand: Record<BrandKey, ColorValue>;
  status: Record<StatusKey, AuthoredColor>;

  grayscale?: Partial<
    Record<GrayStep, GeneratedColor>
  >;

  brandGrayscale?: Partial<
    Record<BrandKey,
      Partial<Record<GrayStep, GeneratedColor>>
    >
  >;

  content: Record<RadixHue, ContentHue>;
  custom?: Record<string, AuthoredColor>;

  semanticTokens: { /* existing mappings */ };
}
```

Example of string shorthand, token reference, and explicit mode override:

```typescript
colors: {
  status: {
    success: {
      value: "#008A3E",
      modes: { dark: "#38B76D" }
    }
  },

  content: {
    tomato: {
      standard: "#E30613",
      soft: {
        value: "#F4B2AC",
        modes: { dark: "#C47E79" }
      }
    }
  },

  grayscale: {
    100: { modes: { dark: "#282828" } }
  },

  custom: {
    annotation: {
      value: "content-tomato-soft"
    }
  }
}
```

**Resolution precedence:** explicit value for active mode → automatic derivation from source → automatic generation for source-less scales.

Token references resolve through the same centralized resolver; aliases must not receive duplicate color transformations.

## 5. Curated Palettes and Usage

Curated palettes contain **references**, not additional color definitions. References resolve after mode derivation.

- **Layout:** `main`, `brand`, `status`, grayscales and generated brand tints.
- **Content:** `content`, `custom`, and curated palettes.
- **Components/templates/UI:** prefer theme references; external colors remain permitted.

## 6. Required Changes

1. Extend color types and add the 50 authored content colors.
2. Support per-color `modes` overrides, including generated scale steps and brand tints.
3. Implement common mode-aware lightness/chroma derivation with explicit reference-mode selection.
4. Preserve existing grayscale weighting and brand mixing behavior, ensuring BG/FG tonal boundaries are respected.
5. Centralize color reference resolution and derivation across web, mobile, and Canvas.
6. Migrate `flat` tokens; explicitly handle legacy static `gray-pure-*` tokens.
7. Update authoring rules and preserve compatibility aliases.

### Migration and verification rules

- **Cmax is per theme:** the maximum chroma of that theme's authored spectrum (content + custom; status has its own). It preserves the relative saturation differences between the theme's colours.
- **BG/FG are absolute bounds** for tonal derivation, above all for `grayscale` and `brandGrayscale`. A brand tint never pushes a result outside the mode's BG/FG lightness range. Automated tests cover low-contrast and chromatic modes.
- **Legacy parameters are not mapped blindly:** `brand/statusLight/DarkAmount`, `grayColorMixPercentage` and `flatSaturationAdjust` are linear sRGB mixes, not equivalent to the OKLCH transformations. Their behaviour is preserved during migration and they are retired afterwards where appropriate.
- **One resolved semantic across platforms:** web, mobile and Canvas consume the same resolver output (`theme-engine/color/resolve.ts`); each only decides how to emit it.

### Implementation order

Types → shared derivation engine → resolver → tests → theme authoring → consumers → migration cleanup.

Tests cover explicit mode overrides, token references, immutable source colours, BG/FG boundaries, chroma-spectrum preservation and arbitrary modes.

| Step | State |
|---|---|
| Types (`types/color-system.ts`) | done, additive |
| Derivation (`theme-engine/color/oklch.ts`, `derive.ts`) | done |
| Resolver (`theme-engine/color/resolve.ts`) | done |
| Tests (`theme-engine/color/__test__/color.test.ts`) | done |
| Theme authoring (50 colours × themes) | todo |
| Consumers (web emit, mobile emit, Canvas `ink()`) | todo |
| Migration cleanup (`flat-*` aliases, `gray-pure-*`, legacy amounts) | todo |

**Principle:** Palettes define source identity. Modes define adaptation. Explicit authoring overrides the engine. The engine only derives missing values.
