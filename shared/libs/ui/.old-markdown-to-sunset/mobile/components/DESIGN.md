# Mobile design: why the library is shaped this way

## What changed, and why

The first version of this library, taken from the LLC project, chose React Native's usual
vocabulary (`variant`, `tone`, `size`), a hand-written theme of its own, and kept a file per
component translating its props to the web's. Its own design note said when to revisit: when a
second theme or several brands are on the roadmap.

This repo is a seed for many products, each with its own themes. That condition holds, so the
choice is reversed:

- **One vocabulary.** `emphasis`, `status`, `scale`, `state`, read from `ui/types/axes.ts`. The translation files are gone: there is nothing to translate.
- **One law.** `ui/types/elements.ts` says which elements exist, on which platform, with which axis values. A mobile component's props are typed from its row.
- **One theme type.** A mobile theme is a `MobileTheme` (`ui/types/theme.ts`): the same primitives, families, elements and cascade as a web theme, without what only the web has, with what only a phone has.
- **The theme owns the look.** A component holds structure and behaviour; every visual value comes from the theme through `useElement`.

## How a theme reaches a component

```
themes/<id>/v<n>/theme.ts          a MobileTheme, authored
        │   mobile/theme-engine     (pnpm theme:build:mobile)
        ▼
themes/<id>/v<n>/generated/<id>.native.json
        │   ThemeProvider
        ▼
useElement("button", { emphasis, status, scale, states })  →  { view, text, color, icon }
```

The web engine turns a theme into CSS and the browser resolves the cascade. React Native has no
cascade, so the mobile engine emits each rule as a *fragment*, in the order the cascade applies
them, and `resolve` (in `src/theme/resolve.ts`) keeps the fragments whose axes match and merges
them. The colour composition (tint, background alpha, `smart-bw`) is the web stylesheet's formula,
computed in JavaScript.

## What a component still owns

- **Accessibility.** Role, state, label. A component without it is not done.
- **Native props.** A component wraps a React Native component and passes its props through.
- **Press feedback per platform.** iOS dims (`theme.press.opacityDim`), Android ripples (`theme.press.ripple`); both come from the theme. The `active` state restyles the element on both.
- **Structure.** Row or column, what goes where. Never a colour, a size or a spacing.

## What React Native cannot do, and what stands in

| The web has | Mobile does |
|---|---|
| The cascade | Fragments, resolved by `useElement` |
| `:hover` | Nothing. `long-pressed` is the state for what a held press reveals |
| Inherited text colour | A component passes its text style to its own text |
| A stylesheet swapped at run time | A new `theme` or `mode` on the provider re-renders its consumers |

## Not there yet

- Concepts, contextual overrides and rules (theme levels 4 to 6) are not emitted: they need a component's ancestry at run time.
- Gradients, text effects and blur are not emitted. The engine lists what it skipped in the output's `unsupported`, and prints it.
- The unit tests of the first version tested the old props and were removed with them. This repo has no test runner for React Native yet; the tests are owed.
