# Mobile UI fixtures

Renderable fixtures of the mobile UI library: the mobile twin of `web/fixtures`.
A workspace package (`@libs/mobile-ui-fixtures`), never bundled into a product.

```
fixtures/
  _chrome.tsx      Row · FixtureBody · Block
  foundations/     tokens of the active theme, read from the theme at run time: colors, typography,
                   spacing, radius, icons
  elements/        one component each, <family>/<component>.tsx — the family of the root element
  patterns/        recipes of components, no identity of their own
```

Every fixture default-exports a React component. Imports allowed: `@libs/mobile-components`,
`@libs/mobile-layouts`, `../_chrome`, react, react-native. Files starting with `_` are chrome,
not entries.

A fixture renders under a `ThemeProvider` its host supplies: it never names a theme.
