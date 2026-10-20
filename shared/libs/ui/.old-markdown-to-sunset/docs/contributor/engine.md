# Theme Engine

How the CSS engine works. The engine compiles a Theme object into a single
CSS file that owns all visual styling for the application.

---

## Architecture

```
shared/libs/ui/web/theme-engine/
├── conventions.ts     Family prefixes, element→family mapping, selector generation
├── emit.ts            Token-to-CSS emitters (boundary, interior, typography, etc.)
├── theme-process.ts   Main engine: walks theme, generates complete CSS output
├── build.ts           Build script: imports theme, runs engine, writes CSS file
├── index.ts           Barrel export
├── fonts/             Font files (owned by the lib)
├── generated/         Output CSS (one file per theme)
└── sandbox/           Visual test page
```

---

## Convention-Driven

The engine has no hardcoded element lists. It walks the theme object
dynamically and processes whatever it finds.

The only structural knowledge is in `conventions.ts`:

- **FAMILY_PREFIXES** — 9 entries mapping family keys to CSS prefixes
- **ELEMENT_FAMILIES** — maps each element key to its family
- **FAMILY_DEFAULTS** — sensible defaults per family (cursor, transition)

Add an element to the theme → the engine processes it automatically.
No registry to update.

---

## Hybrid CSS Approach

The engine uses **5 CSS custom properties** for composition:
`--bg`, `--fg`, `--tint`, `--border-color`, `--bg-alpha`.

These exist because tint, smart-bw, and alpha mixing require cross-property
composition that plain CSS properties can't express.

**Everything else is plain CSS.** Padding, border-width, radius, shadow,
cursor, transition, typography — set directly on cascade selectors. No
indirection, no variable chains.

---

## Output Structure

The generated CSS file reads as a coherent document:

1. **@font-face** — font file declarations
2. **Tailwind variant declarations** — `@custom-variant dark`
3. **L1: Primitives** — `:root` custom properties (colors, typography, spacing, etc.)
4. **L1b: Modes + Derivations** — per color scheme (`:root` default, `[data-mode]` others)
5. **Tailwind token registrations** — `@theme inline` block
6. **Legacy bridge** — shadcn compat vars (removed as components migrate)
7. **Base layer** — `@layer base` (body bg/fg, border defaults)
8. **Property application** — tint/alpha composition on `[element]` and `[layout]`
9. **Family & element extras** — scrim, placeholder, scrollbar, disabled, icons
10. **Cascade** — L2 families → L3 elements → L4 concepts → L5 contextual → axes → sizes
11. **Component overrides** — `[data-slot]` integration (removed as components migrate)

---

## Build Pipeline

```bash
npx tsx shared/libs/ui/web/theme-engine/build.ts
```

Reads every `themes/<theme>/v<n>/theme.ts`, runs the engine, writes
`themes/<theme>/v<n>/generated/<theme>.css` (+ `<theme>-fonts.css`) beside it.

The app wears exactly one theme@version, chosen in `configs/theme/index.ts`
(`APP_THEME = { theme, version }`); its vite config aliases `@theme` to that
version's generated CSS:
```css
@import "@theme-fonts";
@import "@theme";   /* → shared/libs/ui/themes/wireframes/v2/generated/wireframes.css */
```

Watch mode: `pnpm theme:watch` — rebuilds on theme or engine file changes.

---

## Smart Bleed (Build-Time Resolution)

When the engine encounters `smartBleed` on a contextual child, it resolves
the parent's padding/radius/border-width by walking the cascade (L2→L3→L4),
then emits concrete negative margins and border-radius values on the child's
specific selector. No CSS variables, no runtime computation.

---

## What the Engine Does NOT Do

- No runtime JavaScript in the browser
- No Shadow DOM isolation
- No PR layout class generation
- No runtime linting
- No component modifications
