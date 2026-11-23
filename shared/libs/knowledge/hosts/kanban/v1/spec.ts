import type { Spec } from "../../../previewer-editors/types";

/** The KANBAN: cards in columns. THE COLUMNS ARE DATA: how many, their names, their order and each one's colour come with the board (`columns` in the fixture), not from the component;
 *  the fixtures show two different sets. Cards are dragged into order inside a column and across columns: the drop line says where the card lands (the library's list-draggable way), and `card-moved` carries the column and the index; `moveCard` applies it. The collapsed columns and the look the reader set in the header are told by events, so the consumer keeps them. Cards in columns, each column with a sticky title and count, an add button and a collapse/expand button beside it (Daniel, 23 Oct). A card is dragged to another column and
 *  clicked to open; what opening does (a window with the card's own fields) is the consumer's. The board is pure: data in, events out.
 *  - header: the board's own bar, on when `showHeader`: search and title only (`headerSearch`), the filter by tags and dates (`headerFilter`), and what the reader may change of the look: the view (`headerView`), the tags (`headerTags`), the column width (`headerWidth`). The filter is the board's state; the consumer gives every card.
 *  - view: expanded shows everything a card has; compact only the title and the tags.
 *  - collapsible, addable: the two buttons of the column header.
 *  - columnWidth: every column is this wide.
 *  The board FILLS the box the consumer gives it (a column with a height), never under 350px, and scrolls inside it, down and sideways; the column headers stick to the top of that
 *  scroll area, so they stay wherever the board is placed. The consumer gives the box, the board gives the scroll (Daniel, 23 Oct). */
export const spec: Spec = {
  id: "kanban",
  name: "kanban",
  state: "draft",
  kind: "other",
  layouts: [
    { id: "board", name: "board", description: "the columns the data names, side by side, each in its own colour, the cards in each; drag to move, click to open", image: "none", props: [
      { name: "showHeader", kind: "boolean", default: true }, { name: "headerSearch", kind: "boolean", default: true }, { name: "headerFilter", kind: "boolean", default: true }, { name: "headerView", kind: "boolean", default: true }, { name: "headerTags", kind: "boolean", default: true }, { name: "headerWidth", kind: "boolean", default: true },
      { name: "view", kind: "union", values: ["expanded", "compact"], default: "expanded" },
      { name: "collapsible", kind: "boolean", default: true }, { name: "addable", kind: "boolean", default: true },
      { name: "showImage", kind: "boolean", default: true }, { name: "showText", kind: "boolean", default: true }, { name: "showFrom", kind: "boolean", default: true }, { name: "showTags", kind: "boolean", default: true }, { name: "showDate", kind: "boolean", default: true }, { name: "showLinks", kind: "boolean", default: true },
      { name: "columnWidth", kind: "union", values: ["narrow", "regular", "wide"], default: "regular" },
    ], hover: [] },
  ],
};
