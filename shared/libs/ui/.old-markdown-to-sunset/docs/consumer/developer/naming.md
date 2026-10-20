# Naming

How application components, and their files, are named. This covers the components an app or a slice writes. The library's own elements (`alert-dialog`, `date-picker`) keep the names of the elements table.

## The rule

Not every component has a suffix. A component that is one of the roles below takes that role as its last word, as **Subject + Role** in PascalCase (`OrgMembersPage`, `TwoFactorCard`). A component that is none of the roles has a plain name with no suffix (`Avatar`, `Badge`, `OrgSwitcher`).

The file has the component's name: `SidebarShell.tsx` holds `SidebarShell`. One component per file.

## The roles

| Role | What it is | Example |
|---|---|---|
| `Page` | a route's screen | `OrgMembersPage` |
| `Shell` | the outermost frame the app owns. There are two: `SidebarShell` (`shell-side-nav`) and `NoNavShell` (`shell-none`) | `SidebarShell` |
| `Layout` | the structure of a page inside a shell: the header, an optional left panel, the main column | `SettingsLayout` |
| `Sheet` | a side overlay | `EditMemberSheet` |
| `Modal` | a centered overlay | `RemoveMemberModal` |
| `Toast` | a transient message | `Toast` |
| `Form` | inputs and a submit | `ProfileDataForm` |
| `List` | a vertical collection | `InvitationsList` |
| `Table` | a table | `MembersTable` |
| `Card` | a self-contained surface | `TwoFactorCard` |
| `Tile` | a small, clickable summary block in a grid | `OrganizationTile` |
| `Header` | the top band of a page, card or section | `TitleHeader` |
| `Footer` | the bottom band of a page, card or section | `CardFooter` |
| `Panel` | a bounded region beside or within the main content | `FilterPanel` |

A word that is not in the table is not a role. Add the role here first, then use it.

## Shell and Layout

`layouts.md` defines a shell as the outermost viewport frame, with three variants (`shell-side-nav`, `shell-top-nav`, `shell-none`). A product uses the variants it needs; ours uses `shell-side-nav` and `shell-none`, so it has `SidebarShell` and `NoNavShell` and nothing else is called a shell.

A `Layout` sits inside a shell and builds the page region tree (`Page › PageHeader + PageBody › [LeftSidebar] + Main › Container`). It is that tree with the header and the left panel as its slots. A page does not build its own layout.

## Where components live

A component several slices use is an app component, in `apps/main/shared/web/src/components/`. A slice does not import it: the app injects it at mount, as it injects `toast` and the router (`scaffolding-and-import-boundaries`).
