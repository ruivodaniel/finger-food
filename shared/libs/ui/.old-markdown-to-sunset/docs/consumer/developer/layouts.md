# Layouts

How to compose page structure using shared layout components and compositions.

---

## Core principle

**Rows** (`PageHeader`, `SecondPageHeader`, `MainHeader`, `SecondMainHeader`) — height is set by the theme, width grows to fill the parent.

**Columns** (`LeftSidebar`, `RightSidebar`, `ContextPanel`, `Main`) — width is set by the theme (`Main` takes what is left), height grows to the parent's max.

**Containers** (`PageBody`, `MainBody`) — flex rows that fill the remaining height after their header sibling. They carry their own structural defaults; you do not need to add sizing classes to them.

**`ScrollArea`** — the only element that scrolls. Everything else has `overflow: hidden`. Always place a `ScrollArea` wherever content needs to scroll; never add `overflow: auto/scroll` ad-hoc.

---

## The layout vocabulary

Every structural region carries a `layout` attribute. A div is **either** `layout` or `element`,
never both. The theme engine styles `layout` regions (background, border, etc.) the same way
it styles `element` surfaces — the layout components never emit visual CSS themselves.

Overlays (Dialog, Sheet) are handled by the component library as `element="overlay--*"` surfaces,
not layout regions. They are independent of the page tree.

---

## Full map

```
shell                          ← outermost viewport frame
├── shell-side-nav             ← global sidebar (fixed, collapsible)
├── shell-top-nav              ← global top bar (sticky)
└── shell-none                 ← no chrome (auth pages, standalone)

page                           ← everything inside the shell content area
├── page-header                ← full-width page title / action bar
├── second-page-header         ← optional second full-width row under it (e.g. the tabs)
└── page-body                  ← flex row: left-sidebar + main + right-sidebar
    ├── left-sidebar           ← secondary sidebar (contextual, e.g. settings nav)
    ├── main                   ← primary column, fills remaining space
    │   ├── main-header        ← full-width region spanning main column (sticky optional)
    │   ├── second-main-header ← optional second full-width row under main-header
    │   └── main-body          ← scrollable content below the headers
    │       ├── container      ← width-constrained content wrapper (width + align props)
    │       └── context-panel  ← inline aside inside main (e.g. knowledge panel, properties)
    └── right-sidebar          ← full-height aside beside main (e.g. activity feed)

scroll-area                    ← canonical internal scroll container (use anywhere)
```

---


## Anatomy diagram

### Shells

**shell-top-nav**
```
┌─────────────────────────────────────────────────┐
│  shell-top-nav                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│                     PAGE                        │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**shell-side-nav**
```
┌────────┬─────────────────────────────────────────┐
│        │                                         │
│        │                                         │
│  shell-│             PAGE                        │
│  side- │                                         │
│  nav   │                                         │
│        │                                         │
└────────┴─────────────────────────────────────────┘
```


**shell-none**
```
┌─────────────────────────────────────────────────┐
│  shell-none                                     │
│                                                 │
│                                                 │
│                     PAGE                        │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```


## Anatomy diagram

```
┌────────────────────────────────────────────────────────────────┐
│  page-header                                                   │
├────────────────────────────────────────────────────────────────┤
│  second-page-header                                            │
├──────────────┬──────────────────────────────────────┬──────────┤
│              │  main-header                         │          │
├──────────────├──────────────────────────────────────├──────────┤
│              │  second-main-header                  │          │
│  left-       ├──────────────────────────────────────┤  right-  │
│  sidebar     │  main-content                        │  sidebar │
│              │  (insvisible row for body & panel)   │          │
│              ├─────────────────────────┬────────────┤          │
│              │    main-body            │  context-  │          │
│              │  ┌─────────────────┐    │  panel     │          │
│              │  │                 │    │            │          │
│              │  │                 │    │            │          │
│              │  │   container     │    │            │          │
│              │  │                 │    │            │          │
│              │  │                 │    │            │          │
│              │  └─────────────────┘    │            │          │
│              ├─────────────────────────┴────────────┤          │
│              │  main-footer                         │          │
└──────────────┴──────────────────────────────────────┴──────────┘
```


FULL PAGE

```
Shell (shell-side-nav) --> row
├── ShellNav  (shell-nav)        --> col   [width: theme, height: stretch]
└── Page      (page)             --> col   [flex: 1]
    ├── PageHeader  (page-header)    --> row  [height: theme, width: 100%]
    ├── SecondPageHeader (second-page-header) --> row [height: theme, width: 100%]  (optional)
    └── PageBody    (page-body)      --> row  [flex: 1]
        ├── LeftSidebar  (left-sidebar)    --> col  [width: theme, height: stretch]
        ├── Main         (main)            --> col  [flex: 1]
        │   ├── MainHeader   (main-header)   --> row  [height: theme, width: 100%]
        │   ├── SecondMainHeader (second-main-header) --> row [height: theme, width: 100%]  (optional)
        │   ├── MainContent  (main-content)  --> row  [flex: 1, invisible]
        │   │   ├── MainBody      (main-body)      --> col  [flex: 1, overflow-y: auto]
        │   │   │   └── container (container)      --> col  [max-width: theme, margin: auto]
        │   │   └── ContextPanel  (context-panel)  --> col  [width: theme, height: stretch]
        │   └── MainFooter   (main-footer)   --> row  [height: theme, width: 100%]
        └── RightSidebar (right-sidebar)   --> col  [width: theme, height: stretch]

    <Page>
      <PageHeader></PageHeader>
      <SecondPageHeader></SecondPageHeader>
      <PageBody>
        <LeftSidebar></LeftSidebar>
        <Main>
          <MainHeader></MainHeader>
          <SecondMainHeader></SecondMainHeader>
          <MainContent>
            <MainBody>
              <Container></Container>
            </MainBody>
            <ContextPanel></ContextPanel>
          </MainContent>
          <MainFooter></MainFooter>
        </Main>
        <RightSidebar></RightSidebar>
      </PageBody>
    </Page>


```

MINIMAL PAGE

```
Shell (shell-none / shell-top-nav) --> col
└── Page      (page)          --> col  [flex: 1]
    └── PageBody (page-body)  --> row  [flex: 1]
        └── Main (main)       --> col  [flex: 1]
            └── MainContent (main-content)  --> row  [flex: 1]
                └── MainBody (main-body)    --> col  [flex: 1, overflow-y: auto]
                    └── container           --> col  [max-width: theme, margin: auto]

    <Page>
      <PageBody>
        <Main>
          <MainContent>
            <MainBody>
              <Container></Container>
            </MainBody>
          </MainContent>
        </Main>
      </PageBody>
    </Page>


```

**Mental model:**
- **Cols** (ShellNav, sidebars, ContextPanel, MainBody): `width` set by theme, height fills parent (`align-self: stretch` or `flex: 1`)
- **Rows** (Shell, Page, PageBody, Main, MainContent): `height` set by theme or fills parent (`flex: 1`), width is always `100%`
- **Fixed edges** (PageHeader, SecondPageHeader, MainHeader, SecondMainHeader, MainFooter): `flex-shrink: 0` — they never shrink; the remaining space goes to MainContent
- All structural flex defaults are **engine-hardcoded** — not theme-overridable. Theme controls surfaces, widths, and heights only.





The `page` region sits inside the shell content area. `page-body` is the flex row.
`second-page-header` and `second-main-header` are optional: a second row under the page header (e.g. the tabs of the page) and under the main header. Use them in order, never alone: no second row without the first.
`main-header` spans the full width of the `main` column — it is NOT inside `left-sidebar`
or `right-sidebar`.

`right-sidebar` and `context-panel` can coexist — the flex layout handles both simultaneously
(e.g. activity feed + properties panel).

---

## Container

`container` is the only layout region that accepts configuration props:

| Prop | Values | Default | Notes |
|------|--------|---------|-------|
| `scale` | `xs` `sm` `md` `lg` `xl` | `lg` | The reading measure. The theme gives each scale its max-width (`layouts.container` in the theme); the page never writes a number |
| `align` | `left` `center` `right` | `center` | Where the measure sits inside main-body |
| `position` | `fill` … | — | As on every region; `fill` = edge to edge, no measure |

```html
<!-- centered, the theme's lg measure -->
<div layout="container">…</div>

<!-- edge-to-edge -->
<div layout="container" position="fill">…</div>

<!-- narrower, left-aligned -->
<div layout="container" scale="md" align="left">…</div>
```

---

## ScrollArea

`scroll-area` is the canonical way to make any container internally scrollable. Use it
anywhere a region needs to scroll — inside a card, a sidebar, a dialog, a panel, the main
body. It is not tied to the page tree.

The structural behaviour it encapsulates (`flex: 1 / min-height: 0 / overflow-y: auto`) is
a constant source of broken layouts when reinvented ad-hoc. Using `ScrollArea` everywhere
means this is always correct and the theme applies consistent scrollbar styling automatically.

```tsx
// inside a card
<Card>
  <CardHeader>…</CardHeader>
  <ScrollArea>
    <LongList />
  </ScrollArea>
</Card>

// inside a sidebar
<LeftSidebar>
  <NavHeader />
  <ScrollArea>
    <NavItems />
  </ScrollArea>
</LeftSidebar>
```

| Prop | Values | Default | Notes |
|------|--------|---------|-------|
| `axis` | `"y"` `"x"` `"both"` | `"y"` | Controls which axis scrolls |

The theme controls scrollbar appearance via `[layout="scroll-area"]`.

**Constraint:** `ScrollArea` must be inside a flex parent (row or column) to size correctly.
`flex-1 min-h-0` only takes effect inside a flex container. All natural parents in the layout
tree are flex containers, so this is always satisfied. If you ever place it inside a non-flex
container, give it an explicit height instead.

---

## Stack

`stack` is the auto-layout primitive: one box that is a row or a column and owns the gap,
the alignment and the padding between its children. Children own only their content. A
non-uniform composition — a header over two columns over a footer, a label beside a number
beside an action — is nested stacks; a "cell" is another Stack. It is usable inside any
region and is not tied to the page tree.

It replaces hand-rolled `flex` markup. Where a developer would write
`flex items-center justify-between gap-3` and give a child `flex-1 min-w-0`, they write a
Stack and give the child `position="fill"`. The structural rules that break most often when reinvented — the
`min-width: 0` overflow fix on a growing child, mixing row and column nesting — are encoded
once.

```tsx
// a card body: a header row, two equal columns, a footer
<Stack dir="col" gap={16} pad={20}>
  <Stack dir="row" align="center" justify="between">
    <Title />                 {/* hugs left */}
    <Icon name="ellipsis" />  {/* hugs right — the gap fills between */}
  </Stack>
  <Stack dir="row" gap={24}>
    <Stack dir="col" size="fill">…</Stack>              {/* each column grows to half */}
    <Stack dir="col" size="fill" align="end">…</Stack>
  </Stack>
  <Footer />
</Stack>
```

| Prop | Values | Default | Notes |
|------|--------|---------|-------|
| `dir` | `"row"` `"col"` | `"col"` | Main axis |
| `gap` | `number` (px) or a CSS length | — | Space between children |
| `align` | `"start"` `"center"` `"end"` `"stretch"` `"baseline"` | `stretch` (browser default) | Cross-axis alignment |
| `justify` | `"start"` `"center"` `"end"` `"between"` `"around"` | `start` (browser default) | Main-axis distribution |
| `wrap` | `boolean` | `false` | Children flow onto new lines (a cluster) |
| `size` | `"hug"` `"fill"` `"fixed"` | `"hug"` | How this Stack sizes inside its parent Stack |
| `pad` | `number` (px) or a CSS length | — | Inner padding |

Sizing is Figma's vocabulary, set on the child:

| Size | Behaviour | Flex |
|------|-----------|------|
| `hug` | As small as its content | `flex: none` |
| `fill` | Grows into the leftover space; may shrink below content size | `flex: 1 1 0; min-width/height: 0` |
| `fixed` | Keeps its own width/height: the theme's (a field, an avatar) or, for a non-Stack child, a `position` width (`w-xs`…`w-xl`) | `flex: none` |

A non-Stack child (a Card, a span) takes the same behaviour through its `position`
attribute: `position="fill"` to fill, `position="hug"` to hug (markup-dictionary.md § Position).
The structural utilities (`flex-1 min-w-0`, `flex-none`) still work and are on their way out.

Stack emits `layout="stack"` and `data-dir`. It sets no colour, border, radius or shadow —
those belong to the theme and to the content components placed inside. Gap and padding are
applied inline because they are arbitrary structural values, not visual ones.

`Stack` is the one primitive that takes spacing from markup: `gap` and `pad`, as a number (px) or a CSS
length. No other primitive or component takes a spacing or size number; their spacing and
dimensions come from the theme. `className` and inline `style` are deprecated and are not used
for spacing.

**When not to use it:** when cells must align across both axes at once — a bento dashboard
where the columns of row 2 line up with those of row 1. Stack is one-dimensional per level;
that case is a grid: give the parent `position="cols-N"` and each child `position="span-N"`
(markup-dictionary.md § Position). Never the `grid` utilities.

---

## Position on regions

Every region takes `position` like any surface (markup-dictionary.md § Position): `fill`,
`hug`, `start` `center` `end` `stretch`, `clip`, `w-xs`…`w-xl`, `cols-N` / `span-N`. The
region's own dimension (a sidebar's width, a header's height) stays the theme's; `position`
says where it stands in its parent and how much it takes.

```html
<div layout="context-panel" position="w-lg">…</div>
<div layout="main-body" position="cols-3">…</div>
```

## Region props

| Region | Prop | Values | Default | Notes |
|--------|------|--------|---------|-------|
| `left-sidebar` | `collapsed` | `boolean` | `false` | Emits `state="collapsed"` on the node; theme styles the collapsed state |
| `main-header` | `sticky` | `boolean` | `false` | Opt-in sticky positioning |

---

## Mobile behavior

| Region | Mobile behavior |
|--------|----------------|
| `shell-side-nav` | Collapses to icon rail |
| `left-sidebar` | Hidden (drawer or gone) |
| `right-sidebar` | Hidden |
| `context-panel` | Hidden |
| `main` | Takes full width |

---

## Ownership

### The app owns the shell

Each route file picks a shell variant and wraps the page content. The route
MUST use the layout primitives — `Shell`, `ShellSideNav`, `ShellTopNav`,
`ShellNone`, `Page` — so the theme engine can target them.

```
_protected/route.tsx              _auth/route.tsx
└── Shell                         └── ShellNone
    ├── ShellSideNav                  └── Page
    │   └── AppSidebar                    └── <Outlet />
    │       ├── header: logo + module widgets
    │       ├── nav: app-owned items
    │       └── footer: module widgets
    └── Page
        └── <Outlet />
```

See `docs/01_reference/frontend-composition.md` § "App Shell Wiring" for the
full wiring contract.

### Layout components handle structural behavior only

Scroll, overflow, collapse, breakpoints, sticky positioning. They render `layout="..."` attributes.
They know nothing about content or visual appearance. The theme engine handles visuals.

### Modules consume compositions

A module page never builds its own shell or makes structural decisions. It imports a
shared composition and fills the slots.

```tsx
import { StandardPage } from '@prowd/ui/layouts';

function SettingsPage() {
  return (
    <StandardPage
      header={<SettingsPageHeader />}
      sidebar={<SettingsNav />}
      scale="md"
    >
      <AccountSettings />
    </StandardPage>
  );
}
```

---

## Rules

1. **`layout` or `element`, never both.** A div is the structural frame OR the morphological
   surface inside it. Never mix them.

2. **Layout components own all structural decisions.** Scroll, overflow, collapse, breakpoints,
   sticky. Page authors fill slots — they never write structural CSS.

3. **The theme engine styles layout regions.** `layout="left-sidebar"` gets background, border,
   width from the theme. The layout component itself emits no visual CSS.

4. **`main-header` spans the full `main` column.** It is not inside `left-sidebar`. It is a
   full-width region at the top of `main`, sitting above `main-body`.

5. **Modules never build their own shell or navigation.** They consume shared compositions.

---

## Public surface (`@prowd/ui/layouts`)

The package exports two levels:

### Compositions (recommended for module pages)

Ready-to-use slot-based wrappers. Slots are typed as `React.ReactNode`.

| Export | Slots | Notes |
|--------|-------|-------|
| `AuthPage` | `children` | shell-none + a centered `container` at `scale="xs"` |

`StandardPage`, `FullPage` and `SplitPage` are not built yet; pages compose the primitives
directly until they are.

### Primitives (for app-level shell wiring only)

Structural building blocks. Module pages never use these directly.

| Export | Emits |
|--------|-------|
| `Shell` | `layout="shell"` |
| `ShellSideNav` | `layout="shell-side-nav"` |
| `ShellTopNav` | `layout="shell-top-nav"` |
| `ShellNone` | `layout="shell-none"` |
| `Page` | `layout="page"` |
| `PageHeader` | `layout="page-header"` |
| `PageBody` | `layout="page-body"` |
| `LeftSidebar` | `layout="left-sidebar"`, accepts `collapsed` |
| `Main` | `layout="main"` |
| `MainHeader` | `layout="main-header"`, accepts `sticky` |
| `MainBody` | `layout="main-body"` |
| `Container` | `layout="container"`, accepts `scale`, `align`, `position` |
| `ContextPanel` | `layout="context-panel"` |
| `RightSidebar` | `layout="right-sidebar"` |
| `ScrollArea` | `layout="scroll-area"` |
| `Stack` | `layout="stack"`, accepts `dir`, `gap`, `align`, `justify`, `wrap`, `size`, `pad` — the one primitive pages use directly, inside any region |

---

## DOM example

```html
<div layout="shell">

  <div layout="shell-side-nav">
    <div element="surface--sidebar">
      <div element="surface--header">Logo</div>
      <nav element="control-group--navbar">…</nav>
      <div element="surface--footer">User menu</div>
    </div>
  </div>

  <div layout="page">

    <div layout="page-header">
      <div element="surface--page-header">Page title + actions</div>
    </div>

    <div layout="page-body">

      <div layout="left-sidebar">
        <div element="surface--panel">…</div>
      </div>

      <div layout="main">

        <div layout="main-header">
          <div element="surface--main-header">Section title + toolbar</div>
        </div>

        <div layout="main-body">
          <div layout="container" width="lg" align="center">
            Page content
          </div>
          <div layout="context-panel">
            Knowledge panel
          </div>
        </div>

      </div>

      <div layout="right-sidebar">
        Activity feed
      </div>

    </div>

  </div>

</div>
```

---

## File locations

```
shared/libs/ui/web/layouts/
├── components/        Structural primitives
│   ├── Shell/         shell-side-nav | shell-top-nav | shell-none variants
│   ├── Page/          page, page-header, page-body
│   ├── Main/          main, main-header, main-body
│   ├── Sidebars/      left-sidebar, right-sidebar, context-panel
│   ├── Container/     container (width + align props)
│   ├── Stack/         stack (auto-layout: dir · gap · align · justify · wrap · size · pad)
│
└── compositions/      Ready-to-use combinations
    ├── StandardPage/  page-header + left-sidebar + main (most pages)
    ├── FullPage/      page-header + main only (no sidebars)
    ├── AuthPage/      shell-none + centered card
    └── SplitPage/     left-sidebar + main + right-sidebar
```
