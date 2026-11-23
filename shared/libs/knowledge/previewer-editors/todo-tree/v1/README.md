# To-do tree

Items to tick, nest and reorder. **Every item can have items inside it**, at any depth; there is no separate "group".

```tsx
<TodoTree nodes={nodes} onChange={setNodes} closed={closed} onClosed={setClosed}
          hideDone={hideDone} show={{ created: true, completed: true }} editId={justAdded} />
```

## Props

| prop | what |
|---|---|
| `nodes`, `onChange` | the items; every change (a tick, an edit, a drag) goes out as the new list |
| `closed`, `onClosed` | the collapsed rows, by id; the consumer keeps them |
| `hideDone` | the items that are done are not drawn (a group is done when everything inside it is); the numbers keep their place |
| `show` | what a row shows besides its title: `path` (1, 1.2…), `progress` (3/8), `detail` (an "i"), `created`, `completed`, `duration`. The first three are on by default, the dates off |
| `editId` | an item to open for editing now, for the item a page has just added |
| `expandOnClick` | a click on the title opens or closes the item (default off) |
| `editOnDoubleClick` | a double click on the title starts editing it (default off) |
| `buttons` | which of add and edit are drawn (default both); independent of the two clicks above: both can be on. The open arrow of an item with items inside is always drawn: it says who has children |
| `cascadeDown` | ticking an item ticks everything inside it, and unticking unticks it (default on) |
| `cascadeUp` | an item is ticked when everything inside it is, and unticked when one inside is (default on) |

The two cascades are separate switches: with only `cascadeDown`, a parent ticks its items but does not follow them; with only `cascadeUp`, it follows them but ticking it changes only itself; with neither, every item is its own.

## The item (the schema)

`id`, `title` (required), `detail`, `done`, `createdAt` (set when it is made, by `newNode`), `completedAt` (set when it is ticked, cleared when it is unticked), `children`.

A group is done when everything inside it is; its completion date is the last one inside it.

## The actions are not in the tree

A page puts them where it wants. They are small components, each with a value in and an event out: `TodoCount`, `TodoHideDone`, `TodoAddButton`. To add an item, build it with `newNode()`, put it in `nodes` and pass its id as `editId`. The pattern `todo` has two examples: the actions in a header above the list, and the same pieces in the header of a card.

## How a row is laid out

The checkbox, then the title with what goes with it on the same line (the path before it; the progress, the "i" and the dates after it). The title is the part that grows; the line wraps only when the title is too long. At the end of the row three places, always: add, edit, open. A place whose button is off, and the open place of a row with nothing inside, stay empty, so everything lines up at every level. Editing an item has a "done" button (and Enter on the title) to leave it, and "delete".

## Dragging

Grab the handle. The row under the pointer shows where the drop lands: its top is *before*, its bottom is *after*, its middle (after the pointer stays there half a second) is *inside*, as its last child. Inside is shown as an outline and a tint on the row; before and after as a line.

## Dates

The dates are written plainly for now (`12 Oct`, `took 3 days`); the project's format library will replace them.
