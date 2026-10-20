# Theme Authoring

How to write a theme object. A theme is a TypeScript object conforming to
the `Theme` type (`shared/libs/ui/types/theme.ts`).

---

## Theme Object Structure

```
Theme
├── id, name
│
├── colors                         L1 primitive
│   ├── main (white, black)
│   ├── brand (1–4)
│   ├── status (success, info, warning, error → can reference flat)
│   ├── flat (11 accent colors)
│   └── semanticTokens (primary, secondary, accent, muted)
│
├── typography                     L1 primitive
│   ├── fonts (primary, secondary, quote, monoPrimary, monoSecondary)
│   └── types (18 scales, each: fontFamily, fontStyle, fontSizeMobile,
│              fontSizeDesktop, fontWeight, lineHeight, letterSpacing)
│
├── spacing                        L1 primitive (unit multiplier → xs..3xl)
├── radius                         L1 primitive (none, xs, sm, md, lg, xl, full)
├── effects                        L1 primitive (named effect presets)
├── transitions                    L1 primitive (duration + timing scales)
├── borderWidths                   L1 primitive (none → extraThick)
├── icons                          L1 primitive (set, sizes, weight)
│
├── modes                          Cross-cutting
│   └── colorScheme
│       └── each mode: background + foreground anchors + derivation params
│
├── families                       L2 — morphological family defaults
│   ├── surfaceContainer           (IS the base shape)
│   ├── elevatedOverlay            (surface + overlay extras)
│   ├── listContainer              (surface + row/cell/separator/alternating)
│   ├── interactiveControl         (surface wrapper)
│   ├── interactiveControlGroup    (surface wrapper)
│   ├── field                      (surface + placeholder/caret/obfuscation)
│   ├── shape                      (surface wrapper)
│   └── media                      (surface + objectFit/aspectRatio/overlay/filter)
│
├── elements                       L3 — element overrides (sparse deltas)
│
├── concepts                       L4 — product-specific semantic overrides
│   └── [conceptName]: { [target]: SurfaceContainerTokens + accent + contextual }
│
└── contextual                     L5 — parent → child overrides
    └── [parent]: { [child]: SurfaceContainerTokens }
        Keys are element names (e.g. 'sidebar', 'header', 'card')
        matching the keys in ElementTypes. NOT the full attribute
        value (not 'surface--sidebar').
```

---

## Color References

Theme token values can reference colors by name:

| Type | Examples |
|------|----------|
| Primitive | `'main-white'`, `'brand-1'`, `'status-error'`, `'flat-blue'` |
| Derived | `'gray-200'`, `'brand-1-light'`, `'status-error-dark'` |
| Semantic | `'primary'`, `'secondary'`, `'accent'`, `'muted'` |
| Mode anchors | `'background'`, `'foreground'` (resolved from active color mode, not semantic tokens) |
| Special | `'tint'` (current tint value), `'smart-bw'` (auto black/white) |
| CSS | `'transparent'`, `'currentColor'`, `'inherit'` |
| Raw hex | `'#ff0000'` (escape hatch, avoid when possible) |

### Which colour to write

- A surface's fill is `'background'`; its text is `'foreground'`. The two swap in dark mode.
- Text on a coloured fill (a brand, a status) is `'smart-bw'`.
- `'main-white'` and `'main-black'` are written only where the colour must not swap: the mode anchors and the shadows.
- A tinted ground is a brand-tinted gray (`'brand-1-gray-50'`), with the amount in the mode's `grayColorMixPercentage`.

---

## Modes

Each color mode defines background/foreground anchors and derivation parameters.
The engine computes gray scales, brand light/dark, status light/dark from these.

```typescript
modes: {
  colorScheme: {
    light: {
      background: 'main-white',
      foreground: 'main-black',
      derivation: {
        brandLightAmount: 74,
        brandDarkAmount: 20,
        statusLightAmount: 74,
        statusDarkAmount: 20,
        grayColorMixPercentage: '5%',
        flatSaturationAdjust: 0,
      },
    },
    dark: { ... },
  },
}
```

---

## Concepts

Group overrides by business meaning, not by element type:

```typescript
concepts: {
  knowledge: {
    card: {
      accent: 'brand-2',
      boundary: { border: { width: 'default', color: 'gray-pure-500' } },
      contextual: {
        header: {
          smartBleed: 'normal',
          interior: { background: 'brand-2', foreground: 'smart-bw' },
        },
      },
    },
  },
  dashboard: {
    mainContent: {
      interior: { background: 'gray-50' },
    },
  },
}
```

Concepts apply to both elements and layouts. `concept="dashboard"` on a
shell → the theme overrides `mainContent` background for dashboard pages.

---

## Size Variants

Elements that support sizes define them at L3:

```typescript
button: {
  surface: { /* base */ },
  sizes: {
    xs: { partialSurface: { ... }, icon: { size: 'xs' } },
    sm: { partialSurface: { ... }, icon: { size: 'sm' } },
    // ...
  },
}
```

Default scale when absent: `md`.

---

## Tint Pattern

Define emphasis as a visual pattern, use tint for the color:

```typescript
interactiveControl: {
  surface: {
    emphasis: {
      primary: {
        partialSurface: {
          tint: 'primary',                      // accent color
          interior: { background: 'tint', foreground: 'smart-bw' },
          boundary: { border: { color: 'transparent' } },
        },
      },
    },
    status: {
      error: { partialSurface: { tint: 'status-error' } },
      // status only overrides tint → pattern stays, color changes
    },
  },
}
```
