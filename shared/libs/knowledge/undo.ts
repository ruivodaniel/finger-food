// UNDO — one person's edits, to undo and to redo, for any document whose edits are changes by path. It belongs to the editing
// session: nothing here is stored, it knows no host and no server, and whoever sends the changes decides what to do with them.

export interface UndoableChange {
  opId: string;
  path: string[];
  before?: unknown;
  after?: unknown;
}

export interface UndoHistory {
  /** A new edit of this person's: it clears what could be redone. While an edit lasts, what it changes is one entry. */
  recordEdit(changes: UndoableChange[], editInProgress: boolean): void;
  /** The edit in progress ended: what comes next is a new entry. */
  endEdit(): void;
  /** The inverse of the last edit, moved to what can be redone. Nothing: there is nothing to undo. */
  takeUndo(): UndoableChange[] | null;
  /** The inverse of what was last undone, moved to what can be undone. Nothing: there is nothing to redo. */
  takeRedo(): UndoableChange[] | null;
  /** Changes that were refused never happened: they leave both stacks. */
  forgetChanges(opIds: Set<string>): void;
  clear(): void;
}

export function createUndoHistory(newOpId: () => string): UndoHistory {
  let undoEntries: UndoableChange[][] = [];
  let redoEntries: UndoableChange[][] = [];
  let editEntryOpen = false;

  const inverseOf = (entry: UndoableChange[]) => [...entry].reverse().map((change) => ({ opId: newOpId(), path: change.path, before: change.after, after: change.before }));
  const withoutChanges = (entries: UndoableChange[][], opIds: Set<string>) => entries.map((entry) => entry.filter((change) => !opIds.has(change.opId))).filter((entry) => entry.length > 0);

  return {
    recordEdit(changes, editInProgress) {
      redoEntries = [];
      const openEntry = editEntryOpen ? undoEntries.at(-1) : undefined;
      if (openEntry) openEntry.push(...changes);
      else undoEntries.push([...changes]);
      editEntryOpen = editInProgress;
    },
    endEdit() {
      editEntryOpen = false;
    },
    takeUndo() {
      const entry = undoEntries.pop();
      if (!entry) return null;
      const inverse = inverseOf(entry);
      redoEntries.push(inverse);
      return inverse;
    },
    takeRedo() {
      const entry = redoEntries.pop();
      if (!entry) return null;
      const inverse = inverseOf(entry);
      undoEntries.push(inverse);
      return inverse;
    },
    forgetChanges(opIds) {
      undoEntries = withoutChanges(undoEntries, opIds);
      redoEntries = withoutChanges(redoEntries, opIds);
    },
    clear() {
      undoEntries = [];
      redoEntries = [];
      editEntryOpen = false;
    },
  };
}
