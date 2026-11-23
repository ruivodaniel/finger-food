// The knowledge library's undo history. It lives in a library with no test runner, so its tests live here, with what uses it.
import { describe, expect, it } from "vitest";
import { createUndoHistory, type UndoableChange } from "@libs/knowledge/undo";

let opCounter = 0;
const newOpId = () => `new${(opCounter += 1)}`;
const edit = (opId: string, before: unknown, after: unknown, path = ["items", "a", "x"]): UndoableChange => ({ opId, path, before, after });
const shapeOf = (changes: UndoableChange[] | null) => changes?.map(({ path, before, after }) => ({ path, before, after })) ?? null;

describe("undo and redo", () => {
  it("nothing to undo or redo: nothing", () => {
    const history = createUndoHistory(newOpId);
    expect(history.takeUndo()).toBeNull();
    expect(history.takeRedo()).toBeNull();
  });

  it("undo is the inverse of the last edit, under new opIds, and redo the inverse of that", () => {
    const history = createUndoHistory(newOpId);
    history.recordEdit([edit("o1", 0, 1)], false);
    const undone = history.takeUndo()!;
    expect(shapeOf(undone)).toEqual([{ path: ["items", "a", "x"], before: 1, after: 0 }]);
    expect(undone[0]!.opId).not.toBe("o1");
    const redone = history.takeRedo()!;
    expect(shapeOf(redone)).toEqual([{ path: ["items", "a", "x"], before: 0, after: 1 }]);
    expect(shapeOf(history.takeUndo())).toEqual([{ path: ["items", "a", "x"], before: 1, after: 0 }]);
  });

  it("goes back edit by edit, last first", () => {
    const history = createUndoHistory(newOpId);
    history.recordEdit([edit("o1", 0, 1)], false);
    history.recordEdit([edit("o2", 1, 2)], false);
    expect(shapeOf(history.takeUndo())![0]).toMatchObject({ before: 2, after: 1 });
    expect(shapeOf(history.takeUndo())![0]).toMatchObject({ before: 1, after: 0 });
    expect(history.takeUndo()).toBeNull();
  });

  it("an entry with several changes inverts them in reverse order", () => {
    const history = createUndoHistory(newOpId);
    history.recordEdit([edit("o1", 0, 1), edit("o2", 1, 2)], false);
    expect(shapeOf(history.takeUndo())!.map((change) => change.after)).toEqual([1, 0]);
  });

  it("a new edit clears what could be redone", () => {
    const history = createUndoHistory(newOpId);
    history.recordEdit([edit("o1", 0, 1)], false);
    history.takeUndo();
    history.recordEdit([edit("o2", 0, 5)], false);
    expect(history.takeRedo()).toBeNull();
  });

  it("while an edit lasts, what it changes is one entry; when it ends, the next is new", () => {
    const history = createUndoHistory(newOpId);
    history.recordEdit([edit("o1", "", "a")], true);
    history.recordEdit([edit("o2", "a", "ab")], true);
    history.endEdit();
    history.recordEdit([edit("o3", "ab", "abc")], false);
    expect(history.takeUndo()).toHaveLength(1);
    expect(shapeOf(history.takeUndo())!.map((change) => change.after)).toEqual(["a", ""]);
  });

  it("the edit that is still open when it starts opens its own entry", () => {
    const history = createUndoHistory(newOpId);
    history.recordEdit([edit("o1", 0, 1)], false);
    history.recordEdit([edit("o2", 1, 2)], true);
    expect(history.takeUndo()).toHaveLength(1);
    expect(history.takeUndo()).toHaveLength(1);
  });

  it("what was refused leaves both stacks; an entry left with nothing goes, and the others stay", () => {
    const history = createUndoHistory(newOpId);
    history.recordEdit([edit("keep", 0, 1)], false);
    history.recordEdit([edit("refused", 1, 2)], false);
    history.forgetChanges(new Set(["refused"]));
    expect(shapeOf(history.takeUndo())![0]).toMatchObject({ before: 1, after: 0 });
    expect(history.takeUndo()).toBeNull();

    history.recordEdit([edit("o", 0, 1, ["items", "a", "x"]), edit("p", 0, 1, ["items", "b", "x"])], false);
    const undone = history.takeUndo()!;
    history.forgetChanges(new Set([undone[0]!.opId]));
    expect(history.takeRedo()).toHaveLength(1);
  });

  it("clearing empties both", () => {
    const history = createUndoHistory(newOpId);
    history.recordEdit([edit("o1", 0, 1)], false);
    history.recordEdit([edit("o2", 1, 2)], false);
    history.takeUndo();
    history.clear();
    expect(history.takeUndo()).toBeNull();
    expect(history.takeRedo()).toBeNull();
  });
});
