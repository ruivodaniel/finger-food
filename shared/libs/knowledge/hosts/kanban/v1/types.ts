/** The kanban board: cards in columns. Data in, events out; it never saves and never opens anything. Not a previewer and not an entity editor: an "other" component (Daniel, 23 Oct).
 *  Who the cards are is the consumer's business: a card here is what the board draws of one. */
export type KanbanColumn = { id: string; name: string; /** the column's colour: a css colour or a var() */ tone?: string };
export type KanbanLink = { label: string; url: string };
export type KanbanCard = { id: string; column: string; title: string; text?: string; from?: string; tags?: string[]; images?: string[]; links?: KanbanLink[]; createdAt?: string; /** a dashed card: a note, not a thing */ dashed?: boolean };
export type Kanban = { id: string; name: string; columns: KanbanColumn[]; cards: KanbanCard[] };
/** what the board tells the consumer; it changes nothing by itself */
export type KanbanEvent =
  /** the card lands in `column` at `index` among that column's cards (the card itself not counted); apply it with `moveCard` */
  | { type: "card-moved"; id: string; column: string; index: number }
  | { type: "card-opened"; id: string }
  /** a card is wanted in `column`: from the column's plus (no `index`: last), or from a double click on the column's free space (`index`: where it was, among that column's cards; apply it with `moveCard` after adding) */
  | { type: "card-added"; column: string; index?: number }
  | { type: "column-toggled"; column: string; collapsed: boolean }
  /** the reader changed the look in the header; a consumer that wants it kept saves it and gives it back as `look` */
  | { type: "look-changed"; look: KanbanLook }
  /** a tag got a colour (a new tag takes the next of the palette) or the reader changed one in the tags window; a consumer that wants them kept saves them and gives them back as `tagColors` */
  | { type: "tag-colors-changed"; colors: Record<string, string> };
/** how the board shows, as the reader may change it in the header */
export type KanbanLook = { view: "expanded" | "compact"; showTags: boolean; columnWidth: "narrow" | "regular" | "wide" };
