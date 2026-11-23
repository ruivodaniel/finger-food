/**
 * A meteor edited live with whoever else has it open. What a meteor is (its fields, how they differ and apply) is said
 * here; collaboration shares it. This is the only place the meteors slice talks to collaboration's live documents: it
 * opens one while a form is on screen, and on each change copies what the form needs into the live-meteor store.
 * Components read that store and call these functions; they never touch collaboration's state.
 */
import { liveDocumentsService, type LiveDocumentSource, type LiveDocumentView } from "@modules/collaboration/web";
import { applyMeteorFields, diffMeteorFields, type MeteorFields } from "../../shared/helpers/meteor-fields";
import { liveMeteors, type LiveMeteorView } from "../../store/live-meteor.store";

interface Open {
  source: LiveDocumentSource<MeteorFields>;
  /** The forms that have it open now: the last to close leaves. */
  count: number;
  close: () => void;
}

const open = new Map<string, Open>();

/** What the form needs of the document, and nothing else. */
function viewOf(view: LiveDocumentView): LiveMeteorView {
  const heldBy: LiveMeteorView["heldBy"] = {};
  for (const held of liveDocumentsService.heldByOthers(view)) {
    if (held.path[0] === "fields") heldBy[held.path[1] as keyof MeteorFields] = { name: held.holder, image: held.holderImage };
  }
  return {
    fields: view.document as MeteorFields | null,
    members: view.members,
    heldBy,
    lockedBy: view.lock?.lockedByName ?? null,
    state: view.state,
    message: view.message,
    heldToast: view.heldToast,
  };
}

const sourceOf = (meteorId: string) => open.get(meteorId)?.source;

export const liveMeteorService = {
  /** While a form is on screen: joins the meteor and keeps the live-meteor store in step. Returns the close. */
  open(meteorId: string): () => void {
    let entry = open.get(meteorId);
    if (!entry) {
      const source = liveDocumentsService.source<MeteorFields>("meteor", meteorId, { diff: diffMeteorFields, apply: applyMeteorFields });
      // collaboration's store changes for every document: copy only when this one's view is a new object
      let last: LiveDocumentView | null = null;
      const copy = () => {
        const view = source.read();
        if (view === last) return;
        last = view;
        liveMeteors.set(meteorId, viewOf(view));
      };
      const unsubscribe = source.subscribe(copy);
      const leave = source.open();
      copy();
      entry = { source, count: 0, close: () => { unsubscribe(); leave(); liveMeteors.drop(meteorId); } };
      open.set(meteorId, entry);
    }
    entry.count += 1;
    const opened = entry;
    return () => {
      opened.count -= 1;
      if (opened.count > 0 || open.get(meteorId) !== opened) return;
      open.delete(meteorId);
      opened.close();
    };
  },
  change: (meteorId: string, next: MeteorFields) => sourceOf(meteorId)?.change(next),
  editStart: (meteorId: string, field: keyof MeteorFields) => sourceOf(meteorId)?.editStart([["fields", field]], "edit"),
  editEnd: (meteorId: string, field: keyof MeteorFields) => sourceOf(meteorId)?.editEnd([["fields", field]]),
};
