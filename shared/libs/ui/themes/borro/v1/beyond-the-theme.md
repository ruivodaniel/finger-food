# BORRO v1 — beyond the theme

The theme is `theme.ts`, beside this note. This records what the catalog review (October 2026) could not settle in the
theme because it depends on a component, the engine, a fixture or the tool. Each entry says what shows, why the theme
cannot reach it, and where it would have to be fixed. This folder is a generated copy of slice-design: the fixes belong
there.

## Components

### Radio — the chosen item of a group never reads "selected", and the dot is square
`shared/libs/ui/web/components/src/components/radio-group/radio-group.tsx`

- `RadioGroupItem` emits `state="selected"` only when it receives the `checked` prop, and `RadioGroup` never passes it.
  Radix knows which one is chosen (`data-state="checked"`), but the theme reads only the library's attributes
  (`state`), so the chosen item keeps the unselected look.
- The inner dot is a Radix `div` with an inline `backgroundColor` and no radius; the `span` around it
  (`surface--radio-inner`) is fully rounded by the theme but does not clip its content. The result is a square.
- The dot's size is `var(--radio-indicator-size, 0.4rem)`, inline; the theme does not set it.

What the theme already does: 22px with a thin line; with `state="selected"`, the gradient disc with the ring and the
glow of `1-assessment.html`. Fix: the group shares its value through a context and each item emits `state="selected"`
when it is its own; the inner `span` takes `rounded-full overflow-hidden`, or the indicator takes `borderRadius: 9999`.

### Spinner — invisible in every theme
`shared/libs/ui/web/components/src/components/spinner/spinner.tsx`

The inner `div` only has `animate-spin`: no size, no border, no `element`. The theme reaches `surface--spinner` (the
box) but not the part that spins. Fix: give the inner an `element` (say `shape--spinner-ring`) or size and border
classes; the theme then sets the colour and the stroke (in the target: 4px, `rgba(76,115,134,.15)`, top `#3B5D6B`).

### Date picker — the arrows sit top left, oversized
`shared/libs/ui/web/components/src/components/date-picker/date-picker.tsx`

`DayPicker` is used without `classNames` or `components` for the navigation; the arrows are react-day-picker's own
buttons (`rdp-button_previous` / `rdp-button_next`, a 24px svg) with no `element`, and the month caption renders below
them because react-day-picker's stylesheet, which positions the navigation, is not loaded. The days are already the
theme's (`control--calendar-day`). Fix: pass `components={{ PreviousMonthButton, NextMonthButton }}` built from the
library's button (`control--button`, `emphasis="quiet"`, `scale="sm"`) and `classNames` that place the navigation to
the right of the caption.

### File upload — the icon touches the text
`shared/libs/ui/web/components/src/components/file-upload/file-upload.tsx`

The inner button (`data-part="default-trigger"`) is `flex items-center justify-center` with no `gap`; the `Upload`
icon and the `span` sit flush. The theme does not reach that button. Fix: `gap-2` on the button.

### Card and Dialog — the description inherits the title's typography
`shared/libs/ui/web/components/src/components/card/card.tsx`
`shared/libs/ui/web/components/src/components/dialog/dialog.tsx`

`CardTitle` / `CardDescription` and `DialogTitle` / `DialogDescription` carry no `element`; both inherit the
`defaultTypography` of `surface--header`. The theme can pick one: the right title (heading3) leaves the description
large and bold; the right description (body) leaves the title at body size. The theme keeps the title. Fix: the title
with `element="type--heading3"` and the description with `element="type--body-small"`, as `AlertDialog` already does.

### Command — the group headings have no margin of their own
`shared/libs/ui/web/components/src/components/command.tsx`

`CommandGroup` leaves the `[cmdk-group-heading]` without an `element`; the theme reaches it only through the menu's
inherited text (small, mono, gray) and cannot give it padding or margin. The air around it comes from the rows'
margins (6.5px above and below each row). Fix: `element="surface--group"` on the group, or an `element` on the heading.

### Sidebar — the "3" badge wraps to the next line (organization-members page)
`shared/libs/ui/web/fixtures/pages/organization-members/index.json`

The page places a loose `Badge` after the `SidebarMenuButton`, which is `w-full`; the badge wraps below it. Fix in the
page: use `SidebarMenuBadge`, which is `absolute` inside the `SidebarMenuItem`.

### Tree view — one size only
`shared/libs/ui/types/elements.ts` (`treeViewItem`)

The table gives `treeViewItem` no scale, so a row cannot carry `sizes`; and a row is a control, so it reads the control
family's text, not the tree's — the tree's own scale cannot reach it either. Fix: give `treeViewItem` the scale axis.

### Switch — one size only
`shared/libs/ui/types/families.ts` (`SwitchTokens`)

The switch has `track` and `thumb`; `sizes` applies to the track, and there is no `sizes` for the thumb. A smaller
track with the same 20px thumb does not work, so the theme keeps the switch at one size (45 × 26).

## Engine

`shared/libs/ui/web/theme-engine/`

- **A gradient cannot be cancelled by a colour.** An `interior.background` that is a gradient writes `--bg-gradient`,
  which the composition formula reads before `--bg`. An element that must cancel the family's gradient (a sidebar item
  with `emphasis="primary"`, a chip, a checkbox) can only do it with another gradient. Hence the theme's flat gradients
  `none`, `surface`, `ground`, `sage`, `slate`, `deep`, `track`. Fix: when emitting a plain `--bg`, also emit
  `--bg-gradient: initial`.
- **The list separator paints the rows.** `listContainer.separator` compiles to `[list] li:not(:last-child)` with the
  separator's fill — every row but the last is painted, and that rule (0,2,1) outranks a row's own hover (0,2,0). The
  theme writes it transparent and puts the rows' hover in `contextual.list`. Fix: emit the separator as a
  `border-bottom` or an `::after`.
- **The tint enters the fill.** The formula mixes 20% of `--tint` into the background and 30% into the border. A status
  whose `tint` is the colour darkens the pale fill; the theme sets the tint equal to the fill (surfaces) or to the
  background (fields). A formula with the tint on the border only would give the exact fill.
- **`contextual` children are bare tokens.** `contextual.<parent>.<child>` reads `interior`, `boundary`, `combined`
  directly; `{ surface: { … } }` is silently ignored. The authoring doc does not say so.
- **The separator element's `height` and `width` are never emitted.** `SeparatorTokens` has them, but the element
  path only emits the surface, so a filled separator is 0px tall and invisible in every theme. The borro theme draws
  it as a top border (horizontal) and a left border (vertical, when its row stretches it); a vertical separator in a
  row that centres its items still has no height. Fix: emit `height` / `width` for the `separator` element.
- **No `state` in `rules` chains.** `ChainSegment` has `key` and `concept` only; "the radio's inner while the radio is
  selected" cannot be written.

## Tool (this standalone)

`tool/web/index.css`, `tool/web/main.tsx`

- `index.css` imports the wireframe-stroke CSS (`@theme`), and the active theme is linked on top of it. Whatever the
  active theme does not restate leaks through: the status `--tint` on fields, the sidebar item's left bar, the tabs'
  underline, the cards' shadow, the chips' uppercase, the switch thumb's `translateX`. The borro theme is explicit on
  those because of this; a new theme will trip on the same. Fix: drop the `@theme` import once the active theme loads,
  or do not import it at all.
- The browser caches the theme CSS: after `pnpm theme:build --only borro`, hard reload (cmd+shift+r).

## Fixtures

- `pages/report` throws `TypeError: a.renderNode is not a function` in every theme.
- `pages/coach-week`: the calendar blocks carry inline colours (purple); they are not the theme's.
- `pages/organization-members`: the table's card has `max-h-[32rem]` with `overflow-auto`; the scroll is the page's.
- `elements/control-groups/radio`: every radio is `scale="md"`; the theme's scales do not show here.
- `patterns/metric-cards`: the embedded stat card is 282px wide and holds three tiles of 57px; with any inset their
  labels clip ("Desktop"), and the header's button clips too. The theme tightens tiles (13px) and nested cards
  (19.5px); the rest is the fixture's width.
- `patterns/status-cards`: the footers hold a time and a button in cards too narrow for both; the time wraps.
- `patterns/kpi-card-1`: the card's content is a `Stack` with its own 22px padding on top of the card's 26px, so the
  inset reads as 48px. The Stack carries no `element`; the theme cannot take its padding away.
- `elements/surfaces/spinner`: see Spinner above.
