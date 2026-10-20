# Cascade Specification

Technical details of how the theme cascade translates to CSS.
For the conceptual model, see [Architecture](architecture.md).

---

## Selector Model

Two attributes, never on the same node:

```html
<div element="surface--card">        element = {family}--{element}
<div layout="left-sidebar">          layout = bare name (no prefix)
```

### Part attribute

`part="name"` marks a structural sub-region of a themed ancestor. Use it on
plain divs that a designer needs to control (padding, gap, background) without
giving the div a full element identity.

```html
<div element="surface--card">
  <div part="body">      ← designer controls interior here
  <div part="actions">   ← designer controls gap here
```

Rules: only emit CSS for `part` values **explicitly declared** in the theme
under that surface's `parts` field. An undeclared `part` is inert — zero CSS
emitted. This prevents developers from using `part` as a free styling escape
hatch. `part` is never used on the same node as `element` or `layout`.

Selector emitted: `[element="surface--card"] [part="body"] { ... }`

### Family prefixes (for element attribute)

| Family key              | Prefix          |
|-------------------------|-----------------|
| surfaceContainer        | `surface`       |
| elevatedOverlay         | `overlay`       |
| interactiveControl      | `control`       |
| interactiveControlGroup | `control-group` |
| field                   | `field`         |
| listContainer           | `list`          |
| shape                   | `shape`         |
| media                   | `media`         |

Layout uses `layout="value"` directly — no family prefix.

### Axis attributes (bare, no data- prefix)

`emphasis`, `status`, `state`, `scale`, `concept`

---

## CSS Specificity

CSS source order + specificity handles cascade priority. No variable
chains or bridge systems. The engine emits rules in this order:

```
[element^="surface--"]                                  L2 family (lowest)
[element="surface--card"]                               L3 element
[element="surface--card"][emphasis="primary"]            axis (emphasis first)
[element="surface--card"][status="error"]                axis (status later = wins)
[element="surface--card"]:hover                         pseudo-class (highest)
[element="surface--card"][emphasis="primary"]:hover      compound (most specific)
[concept="X"] [element="surface--card"]                 concept (2 selectors)
[element="A"] [element="B"]                             contextual (2 selectors)
```

---

## Composition Variables

5 CSS custom properties handle cross-property composition:

| Variable | Why it exists |
|----------|---------------|
| `--bg` | Tint mixes into background via `color-mix()` |
| `--fg` | `smart-bw` computes foreground from background |
| `--tint` | One color modifies both background and border |
| `--border-color` | Tint mixes into border via `color-mix()` |
| `--bg-alpha` | Alpha composites with transparent |

Everything else is plain CSS. Padding, radius, shadow, cursor, transition,
typography — set directly, no variables.

### Property application (on [element] and [layout])

```css
[element] {
  background: color-mix(in srgb,
    color-mix(in srgb, var(--tint, var(--bg, transparent)) 20%, var(--bg, transparent))
    var(--bg-alpha, 100%),
    transparent
  );
  color: var(--fg, inherit);
  border-color: color-mix(in srgb,
    var(--tint, var(--border-color, transparent)) 30%,
    var(--border-color, transparent)
  );
}
```

---

## Output Principles

1. **Zero theme = zero cascade lines.** Only structural plumbing remains.
2. **Only emit what the theme defines.** No defaults copied to elements.
3. **Deltas only.** Elements don't repeat family values.
4. **One file, all modes.** Default on `:root`, others on `[data-mode]`.
5. **Readable in devtools.** Each rule shows what it does.

---

## Smart Bleed CSS

Resolved at build time. The engine computes the parent's padding, radius,
and border-width from the cascade, then emits:

```css
/* Horizontal bleed into parent padding */
[selector] {
  margin-left: calc(-1 * <parent-px>);
  margin-right: calc(-1 * <parent-px>);
  padding-left: <parent-px>;
  padding-right: <parent-px>;
}

/* First child: bleed top + inherit parent top corners */
[selector]:first-child {
  margin-top: calc(-1 * <parent-py>);
  padding-top: <parent-py>;
  border-top-left-radius: calc(<parent-radius-tl> - <parent-border-width>);
  border-top-right-radius: calc(<parent-radius-tr> - <parent-border-width>);
  border-bottom-left-radius: 0;   /* straight interior edge (normal mode) */
  border-bottom-right-radius: 0;
}

/* Last child: bleed bottom + inherit parent bottom corners */
[selector]:last-child { ... }
```

Inner radius = outer radius - border-width (child sits inside parent border).
For `border` mode, child extends over the border, so outer radius is used.
For `rounded` mode, interior edges also get radius.
