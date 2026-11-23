# Themes: the baseline, the palettes, a theme, the add-ons

Status: ruled 21 Nov 2026. It replaces the layered model (a theme extending a baseline and wearing a palette at build time).

## The four things

1. **Baseline** (`themes/_baselines/base/v<n>/baseline.ts`). The unthemed whole theme. It holds the default sizes and spacing of every layout, family, element and concept, and the colour transformations of status, hover, active, selected and disabled. It has neutral colours and the light and dark modes, so it renders on its own. A new theme starts as a copy of it.
2. **Palettes** (`themes/_palettes/<name>/v<n>/palette.ts`). A library of named palettes: `colors` and the `gradients` made of them. A theme copies one in when it starts, then owns its copy and edits it. A palette is not read at build time.
3. **Theme** (`themes/<name>/v<n>/theme.ts`). One whole file, colours included. It is not layered over the baseline: nothing is merged at build time.
4. **Add-ons** (`configs/theme`: the knowledge leaves and the slices' own files). Separate from the theme and agnostic of it: an add-on sets only its own things (the look of a library that is not the UI library) and takes its colours from the theme's roles. Add-ons are applied after the theme, in the order the config lists them. This is the only merge at build time.

## The order a theme and the baseline are written in

1. Tokens: colours, colour modes, type, spacing unit, radius, border widths, effects, transitions, icons.
2. Layouts and body.
3. Each family, followed by its elements: surface, control, control group, field, overlay, list, table, shape, media. What is inside a container (contextual) is written with that container.
4. Concepts: a name markup gives, with the parts it changes.
5. Rules: chains that cross elements, flags and concepts.

A family says what everything in it looks like. An element says only what differs from its family.

## Tint

`tint` is a colour, or `{color, opacity}`: the same colour at a strength from 0 to 1. A theme never writes CSS.

The fill of an element is composed in this order:

1. the fill at its alpha (`background`, `backgroundAlpha`);
2. the element's tint washes it at 20% (a status writes this one);
3. the tint of a state entry (`where.state`) washes that at 20%.

The washes are not scaled by the fill's alpha. The border colour is composed the same way, at 30%. So a hover on an error darkens the error: both tints apply.

## Density

Density is a multiplier the theme owns, with its own cascade, outermost to innermost: the theme, the user's density mode (`data-density` on the root), the element, the concept. Each kind (`spacing`, `gap`, `font`, `icon`, `width`, `height`) multiplies by its own product; `all` is what a kind left out takes; nothing set is 1. It scales static measures, never borders, radius, shadows, transitions, colours or the breakpoints. Markup knows nothing of it: it names a concept, and the theme says what the concept does.

## What a fix in the baseline does

A change to the baseline does not reach a theme that was copied from it. A check compares each theme with the baseline and warns about what the baseline has that the theme lacks; someone then decides for that theme. The check is not written yet.

## Legacy

`extends` and `palette` on a theme, and the resolver's baseline and palette layers (`theme-engine/web/v2/resolve.ts`), are legacy: wireframe stroke v5 still uses them, and no new theme does.

## Open

- The check of a theme against the baseline.
- The names of the palettes in the library: today each carries the name of the theme it was extracted from.
- The palette selector of the cockpit: a preview that swaps a theme's colours for a library palette, without changing the theme file.
