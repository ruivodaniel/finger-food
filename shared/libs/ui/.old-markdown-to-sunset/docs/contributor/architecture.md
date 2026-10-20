# Architecture

> Only the architect may modify this document.

---

## Fundamental Principle

**Absolute, hermetic separation between structure and appearance.**

| Concern | Owns | Lives in |
|---------|------|----------|
| **Markup** | Positioning, flow, semantic identity, flags | Components, Layouts, Pages |
| **Theme** | Every visual property: color, border, radius, shadow, spacing, typography, transitions, opacity, cursor, effects | One theme object per product |

---

## Visual Primitives

Everything rendered on screen is one of five primitives:

| Primitive | What | Morphological families |
|-----------|------|----------------------|
| **Rectangle** | Bounded region with boundary + interior | Surface, Overlay, Control, Control Group, Field, List, Layout |
| **Vector Graphic** | Icons, SVGs, logos, decorative shapes | Shape |
| **Media** | Images, video, embedded content | Media |
| **Typography** | Styled text | Not a family (see below) |
| **Animation** | Transitions, keyframes, motion | Cross-cutting — applied via tokens |

---

## Morphological Families

Every visual element belongs to one family. All share the same base token
shape (**SurfaceContainerTokens**). Some extend it. The element → family map is
`shared/libs/ui/types/elements.ts`, one line per element, and it also says which
elements have `sizes` (scale). The theme types, the engine and the components derive from it.

| # | Family | Attribute | Prefix | Examples |
|---|--------|-----------|--------|----------|
| 1 | Surface Container | `element` | `surface` | card, panel, section, header, footer, badge, avatar, tile, alert, separator, panel-header, panel-content, panel-footer, progress, spinner, skeleton |
| 2 | Elevated Overlay | `element` | `overlay` | dialog, drawer, panel-overlay, popover, tooltip, toast, hamburger-menu |
| 3 | Interactive Control | `element` | `control` | button, icon-button, chip, toggle, switch, checkbox, radio, tab-trigger |
| 4 | Interactive Control Group | `element` | `control-group` | topbar, navbar, sidebar-nav, tab-bar, breadcrumb, pagination-bar, button-group, toggle-group |
| 5 | Field | `element` | `field` | input, textarea, select, combobox, date-picker, otp |
| 6 | List Container | `element` | `list` | table, list, accordion, menu, tree-view |
| 7 | Shape | `element` | `shape` | icon, svg, logo, decorative |
| 8 | Media | `element` | `media` | image, video, embedded |
| 9 | Layout | `layout` | — | shell, shell-side-nav, shell-top-nav, shell-none, page, page-header, second-page-header, page-body, left-sidebar, main, main-header, second-main-header, main-body, container, context-panel, right-sidebar, scroll-area |

### Family-specific extensions

| Family | Extra tokens beyond SurfaceContainerTokens |
|--------|---------------------------------------------|
| Elevated Overlay | scrimColor, scrimOpacity, scrimBlur, entrance/exit animation |
| Field | placeholderColor, placeholderOpacity, obfuscation, caretColor |
| List Container | row, cell, separator, alternating (each PartialSurfaceTokens) |
| Media | objectFit, aspectRatio, overlay, filter |
| Layout | (no extensions — uses SurfaceContainerTokens directly) |

### Two attributes: `element` and `layout`

A DOM node carries **either** `element` or `layout`, never both.

- `element` = morphological identity (what this surface IS)
- `layout` = structural region (where this sits in the page)

Both are themed identically by the cascade engine. The separation exists
because they are different concerns: layout is the frame, element is the
surface inside it.

### Part attribute

Not implemented in the engine today; the engine knows only its own zones,
`data-part="start-icon" | "end-icon" | "thumb" | "scrim"`.

`part="name"` marks a structural sub-region inside a themed ancestor. It goes
on plain divs that need designer-controlled spacing, gap, or background without
carrying a full element identity. Only parts explicitly declared in the theme's
`parts` field for that surface produce any CSS — undeclared parts are invisible
to the engine. A node never carries both `part` and `element`/`layout`.

---

## The Universal Shape: SurfaceContainerTokens

Every family uses the same base token structure:

```
boundary         border (width, style, color, per-side), radius (all, per-corner),
                 effect (named preset or layers), outline (width, style, color, offset)

interior         background, backgroundAlpha, foreground, opacity,
                 padding (all, x/y, per-side), gap (all, h/v),
                 separator, scrollbar (thumb, track, width)

defaultTypography  typographyType (pointer to root scale), textTransform,
                   textDecoration, textEffect

tint             accent color (for emphasis/status composition)
cursor           CSS cursor value
smartBleed       false | 'normal' | 'rounded' | 'border' | 'border-rounded'
transition       duration, timing

states           hover, active, focus, selected, disabled, loading
status           neutral, error, warning, success, info, destructive
emphasis         hero, primary, secondary, tertiary, quiet
```

Every property is optional. Only define what you customize.

---

## Typography

Typography is **not a family**. Handled two ways:

**Default typography (on surfaces):** Surfaces that contain text use
`defaultTypography` to point at a root type scale. Changes per size variant.
Color comes from `interior.foreground`, never from typography.

**Typography in markup:** Multiple text styles inside a container use
`element="type--heading2"`, `element="type--bodySmall"` etc.

**18 root type scales:** heading1–4, bodyExtraLarge–bodyExtraSmall,
quoteLarge–quoteSmall, code, numbersExtraLarge–numbersExtraSmall.

---

## The Cascade

A designer builds incrementally. Each level only declares what it changes:

| Level | What | Selector |
|-------|------|----------|
| L1 | Primitives | `:root` vars |
| L1b | Modes + Derivations | `:root` / `[data-mode]` vars |
| L2 | Family defaults | `[element^="{prefix}--"]` or `[layout="..."]` |
| L3 | Element overrides | `[element="{prefix}--{name}"]` |
| L4 | Concept overrides | `[concept="X"] [element="..."]` |
| L5 | Contextual overrides | `[element="A"] [element="B"]` |

### Overlay axes (compose with any level)

| Priority | Axis | Values |
|----------|------|--------|
| 3 (highest) | State | hover, active, focus, selected, disabled, loading |
| 2 | Status | neutral, info, success, warning, error, destructive |
| 1 (lowest) | Emphasis | hero, primary, secondary, tertiary, quiet |

Priority is the author's: the engine emits the `combined` entries of a surface in
the order they are written. Write emphasis first, then status, then state, if that
is the priority you want.

### Scale (structural, not an overlay)

`scale` adjusts padding, typography, icon size. Never colors. Values:
xs, sm, md, lg, xl. Only elements with `sizes: true` in the elements table
can be authored per scale; the engine emits `[element=…][scale=…]` from an
element's `sizes`, never at family level, never inherited from a parent.

### Concepts

Product-specific semantic identity. A concept wraps elements and overrides
their visual treatment. Grouped by concept in the theme:

```typescript
concepts: {
  knowledge: {
    card: { accent: 'brand-2', ... }
  },
  dashboard: {
    mainContent: { interior: { background: 'gray-50' } }
  }
}
```

Concepts work identically for elements and layouts.

---

## Tint Mechanism

Prevents combinatorial explosion of emphasis + status combinations.

1. Emphasis defines a **pattern** (filled, outlined, ghost) and sets `tint`
2. Status overrides `tint` to recolor the pattern
3. Properties reference `'tint'` or `'smart-bw'` — they adapt automatically

Primary button: `tint='brand-1'`, `bg='tint'`, `fg='smart-bw'` → blue filled.
Primary + error: status overrides `tint` to red → red filled, same pattern.

**smart-bw:** auto-picks black or white based on resolved background lightness.

---

## Smart Bleed

A theme-driven mechanism where a child element extends its background into
the parent's padding/border area. Resolved at build time — the engine computes
the parent's padding/radius from the cascade and emits concrete negative margins.

| Value | Behavior |
|-------|----------|
| `false` | Off |
| `'normal'` | Bleeds over padding, outer corners rounded, inner edges straight |
| `'rounded'` | Bleeds over padding, all corners rounded |
| `'border'` | Bleeds over padding + border, outer corners rounded, inner edges straight |
| `'border-rounded'` | Bleeds over padding + border, all corners rounded |

---

## Color System

**Primitives:** main (white/black), brand (1–4), status (success/info/warning/error),
flat (11 accent colors), semanticTokens (primary/secondary/accent/muted).

**Derivations (computed by engine):** gray-50–950 (from bg↔fg), gray-pure (mode-independent),
brand-N-gray-step (tinted grays), brand-N-light/dark, status-X-light/dark, smart-bw, tint.

**Modes:** light, dark, lowContrastLight, lowContrastDark. Each defines background/foreground
anchors and derivation parameters. Not separate themes — transforms on the same primitives.

---

## CSS Ownership

The theme engine is the **single owner** of all visual CSS.

- One generated file per theme. One import in the app.
- The engine generates: @font-face, primitives, modes, Tailwind registrations,
  base layer, cascade rules, component overrides.
- If the theme isn't loaded, there's no visual identity. Correct behavior.
- No other library, module, or app emits visual CSS.

---

## Authority

Only the architect may change this document or make architectural decisions.
