// EDITING — the contract every entity previewer with an editor follows. Ruled 24 Oct 2026 (Daniel), written here so it is not lost:
//
// 1. A previewer with an editor shows an EDIT BUTTON on hover, at its top right, and only when the consumer gave it an `edit`. Click opens the
//    entity's editor in a SHEET. The click never reaches the canvas or the list behind (no selection, no drag).
// 2. The editor is PURE: data in, a draft out, submit. It knows nothing of where the data came from. The same editor serves a fixture in the cockpit,
//    a row in a canvas, a mention in a rich text editor later.
// 3. The INSTANTIATOR knows the source and says it: `source: "fixture"` (the cockpit, a drawing's own data) or `source: "live"` (a real row of a
//    project, reached by id through the entity store). The sheet shows it, loudly when live: a strong warning badge, "you are editing the real
//    entity; every place that shows it will change". A fixture edit says quietly that it stays local.
// 4. On submit the instantiator's `onSubmit` receives the draft: a fixture consumer keeps it in its state; a live consumer writes through the server,
//    and the entity store's stream brings the new row to every instance.
// 5. Which previewers have an editor: persona, organization, goal, use case, goal group, exploration, canvas card, canvas note, edge label.
//    Not: erd node (DBML, its own editor later), ui snapshot, live play.
export type EditSource = "fixture" | "live";
export type Edit<D, L = unknown, A = unknown> = {
  source: EditSource;
  /** the draft the user submitted; the instantiator saves it where the source says */
  onSubmit: (next: D) => void | Promise<void>;
  /** what the sheet calls the thing: "canvas card", "persona"… */
  kind?: string;
  /** what the editor needs from outside (lists to pick from): the instantiator fetches, the editor only draws */
  lookups?: L;
  /** what the editor cannot do alone (generate an image, upload a file, open a crop modal): the instantiator implements, the editor calls and applies the result to the draft */
  actions?: A;
  /** the sheet's width: md (default) or lg for editors with pictures */
  size?: "md" | "lg";
};
/** an editor: the draft and a way to change it; it draws the fields and nothing else */
export type EditorProps<D, L = unknown, A = unknown> = { draft: D; onChange: (next: D) => void; lookups?: L; actions?: A };
