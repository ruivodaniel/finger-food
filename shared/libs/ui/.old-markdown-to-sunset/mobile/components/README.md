# `@libs/mobile-components`

The mobile UI library: React Native components on the same contract as `@libs/web-components`.
The rationale is in [`DESIGN.md`](./DESIGN.md).

## The contract

One table rules both libraries: `shared/libs/ui/types/elements.ts`. Each row is an element, with
its family, the platforms it exists on, and the values it takes on each axis.

A mobile component is one element of that table. It has the same name as its web twin and the
same axis props: `emphasis`, `status`, `scale`, `state`. Its first line says which element it is
and which web component, at which version, it mirrors.

The code is not shared. The web component renders HTML and is styled by CSS; this one renders
React Native views and reads its style from the native theme.

## Quick start

```tsx
import { ThemeProvider, Button, Card, Badge, Text } from "@libs/mobile-components";
import { Stack } from "@libs/mobile-layouts";
import theme from "<themes>/bounx-mobile/v1/generated/bounx-mobile.native.json";

<ThemeProvider theme={theme} mode="light">
  <Card>
    <Stack dir="row" align="center" justify="between" gap={12}>
      <Stack gap={4} size="fill">
        <Badge>Group session</Badge>
        <Text type="heading4">Junior Squad</Text>
      </Stack>
      <Button scale="sm">Start</Button>
    </Stack>
  </Card>
</ThemeProvider>
```

## Components

| Component | Element | Web twin |
|---|---|---|
| `Button` | `control--button` | Button |
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | `surface--card`, `--header`, `--content`, `--footer` | Card and its regions |
| `Badge` | `surface--badge` | Badge |
| `Avatar` | `surface--avatar` | Avatar |
| `Input` | `field--input` | Input |
| `PhoneInput` | `field--phone-input` | PhoneInput |
| `Field`, `Label` | `surface--label`, `--field-description`, `--field-message` | Label and the field wrappers |
| `ChoiceGroup` | `control-group--choice-group` with `control--toggle` | the choice group |
| `Group` | `surface--group` | a titled section |
| `EmptyState` | `surface--empty-state` | EmptyState |
| `Icon` | `shape--icon` | Icon, same semantic names, same icon set (Lucide) |
| `Text` | the typography levels, `type--<level>` | the `type--*` attribute |
| `Stepper` | a composite of `button-group`, `button`, `button-group-text` | none: mobile's own |

`Stack` is in `@libs/mobile-layouts`.

Every interactive component sets its accessibility role and state, and passes the native props of
the React Native component it wraps.

## Theme

A component is themed only by reading the theme. There is no cascade in React Native.

- `ThemeProvider` takes a native theme (the `<id>.native.json` the mobile theme engine writes) and a colour mode.
- `useElement(element, axes)` returns the element's style for its axes: `{ view, text, color, icon, extras }`.
- `usePart(element, part, axes)` does the same for a surface inside an element (a list's row, a switch's thumb).
- `useType(level)` and `useColor(name)` read a typography level and a colour.

A component never writes a colour, a size or a spacing of its own.

## States

`active` (pressed), `focus`, `selected`, `disabled`, `loading` are shared with the web.
`long-pressed` and `swiped` are mobile's. There is no `hover`.
A component computes its states from what happens to it and also accepts `state` to force one.
