# Layout components

Structural scaffolding for page composition. Every component here renders
one `layout="..."` attribute and handles exactly one structural concern
(scroll, overflow, collapse, sticky, width constraint). No visual CSS.
No aesthetic opinions. The theme engine owns all visuals.

## Spec

Full vocabulary, ownership rules, DOM examples, and the anatomy diagram:
→ `shared/libs/ui/docs/consumer/developer/layouts.md`

## Rules that cannot be broken

1. A div renders either `layout` or `element` — never both.
2. These components emit zero visual CSS. No colors, no borders, no shadows.
   Tailwind structural classes only: `flex`, `overflow-hidden`, `sticky`,
   `min-h-0`, `w-full`, `grid` — structural behavior only.
3. Props exposed are structural only: `width`, `align`, `sticky`, `collapsed`.
   No `variant`, no `color`, no `emphasis`.
4. The theme engine reads `layout="..."` attributes and applies all visuals.
   Do not fight it.

## Stack

- React + TypeScript
- Tailwind for structural classes only (flex, grid, overflow, positioning)
- No CSS modules, no inline style objects for visual properties
- No Radix, no headless UI — these are plain divs with layout logic

## Folder structure

```
web/layouts/
├── components/
│   ├── Shell/
│   ├── Page/
│   ├── Main/
│   ├── Sidebars/
│   └── Container/
├── compositions/
│   ├── StandardPage/
│   ├── FullPage/
│   ├── AuthPage/
│   └── SplitPage/
└── index.ts
```
