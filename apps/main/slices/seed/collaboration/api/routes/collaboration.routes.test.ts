// The engine with a kind of document that has nothing to do with a canvas: a fake owner, in memory, and a room that records
// what it is told. It runs without versioning, a database or the canvas.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { DocumentRules } from "../../shared/rules";
import type { DocumentChange, DocumentLease, LiveDocument, SentChanges } from "../../shared/types";
import { mountCollaborationApi } from "../mount";
import type { CollaborativeKind } from "../mount-types";
import type { CollaborationEnv } from "../types";

type NotesDocument = Record<string, string>;
interface StoredVersion { head: string; document: NotesDocument; author: string; note?: string }

const errors = {
  notFound: (message?: string) => new HTTPException(404, { message }),
  badRequest: (message?: string) => new HTTPException(400, { message }),
  unauthorized: (message?: string) => new HTTPException(401, { message }),
  forbidden: (message?: string) => new HTTPException(403, { message }),
  conflict: (message?: string) => new HTTPException(409, { message }),
  unprocessable: (message?: string) => new HTTPException(422, { message }),
};
const NOTE_ID = "note-1";

interface MakeAppOptions { quietMs?: number; capMs?: number }

function makeApp({ quietMs = 3_600_000, capMs = 3_600_000 }: MakeAppOptions = {}) {
  const versions: StoredVersion[] = [{ head: "v0", document: {}, author: "seed" }];
  const latest = () => versions.at(-1)!;
  const notesKind: CollaborativeKind<NotesDocument> = {
    kind: "note",
    // the owner's rules, as a header: x-access is "write" (the default), "read" or "none"
    access: async (scopedAc, _id, action) => scopedAc === "write" || (scopedAc === "read" && action === "read"),
    load: async (id) => {
      if (id !== NOTE_ID) throw errors.notFound(`no note ${id}`);
      return { document: latest().document, head: latest().head };
    },
    applyChanges: (document, changes) => {
      const next = { ...document };
      for (const change of changes) next[change.path[1]!] = change.after as string;
      return next;
    },
    diff: (current, next, newOpId) => Object.keys(next).filter((key) => next[key] !== current[key]).map((key) => ({ opId: newOpId(), path: ["lines", key], after: next[key] })),
    stillHolds: (document, change) => document[change.path[1]!] === change.before,
    findRefusal: async (_id, _current, next) => (Object.values(next).includes("forbidden") ? "that word isn't allowed" : null),
    save: async (_id, document, author, details) => {
      if ((details as { note?: string } | undefined)?.note === "bad") throw errors.unprocessable("the owner refuses this note");
      versions.push({ head: `v${versions.length}`, document, author, note: (details as { note?: string } | undefined)?.note });
      return latest().head;
    },
  };
  const pushed: { room: string; event: string; data: { [key: string]: unknown } }[] = [];
  /** document_lock rows, as the app's table would hold them */
  const storedLocks: { id: string; kind: string; documentId: string; lockedBy: string; createdAt: Date }[] = [];
  // by room: how many tabs of each actor are in it, as the app's room manager counts them
  const roomMembers = new Map<string, Map<string, number>>();
  const { router, services } = mountCollaborationApi({
    rooms: {
      join: (room, actorId) => {
        const members = roomMembers.get(room) ?? new Map<string, number>();
        roomMembers.set(room, members.set(actorId, (members.get(actorId) ?? 0) + 1));
      },
      leave: (room, actorId) => {
        const members = roomMembers.get(room);
        const count = members?.get(actorId) ?? 0;
        if (count <= 1) members?.delete(actorId);
        else members?.set(actorId, count - 1);
      },
      pushToRoom: async (room, options) => { pushed.push({ room, event: options.event, data: options.data as { [key: string]: unknown } }); },
    },
    actorOf: async (actorId) => ({ name: `name of ${actorId}`, image: null }),
    // locks aren't these tests' subject: the app's rules are tested with the real engine and gate in the core
    engine: { allowCreate: () => ({ allow: false }), resolveRead: () => { throw new Error("no locks here"); }, resolveDelete: () => { throw new Error("no locks here"); } } as never,
    // a live document reads its own lock ungated: here, from the locks the test stored
    gatedDb: Object.assign(() => { throw new Error("no gated locks here"); }, {
      ungated: () => ({ select: () => ({ from: () => ({ where: async () => storedLocks }) }) }) as never,
    }),
    createId: () => crypto.randomUUID(),
    errors,
    quietMs,
    capMs,
    leaseMs: 60,
  });
  services.collaboration.registerKind(notesKind);
  const hono = new Hono<CollaborationEnv>();
  // the app's session middleware, as a header: x-actor signs a user in, "none" is nobody
  hono.use("*", async (context, next) => {
    const actor = context.req.header("x-actor") ?? "none";
    context.set("user", actor === "none" ? null : { id: actor });
    context.set("scopedAc", (context.req.header("x-access") ?? "write") as never);
    await next();
  });
  hono.route("/collaboration", router);
  hono.onError((error, context) => (error instanceof HTTPException ? context.json({ error: error.message }, error.status) : context.json({ error: error.message }, 500)));
  const send = (path: string, body: object | undefined, client: string | null, actor: string) =>
    hono.request(`/collaboration/${path}`, { method: "POST", headers: { "Content-Type": "application/json", "x-actor": actor, ...(client ? { "x-client": client } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { app: hono, send, pushed, roomMembers, versions, services, storedLocks };
}

let app: ReturnType<typeof makeApp>;
beforeEach(() => { app = makeApp(); });

const lena = (action: string, body?: object) => app.send(`note/${NOTE_ID}/${action}`, body, "c-lena", "u-lena");
const daniel = (action: string, body?: object) => app.send(`note/${NOTE_ID}/${action}`, body, "c-daniel", "u-daniel");
const write = (opId: string, line: string, text: string): DocumentChange => ({ opId, path: ["lines", line], after: text });
const pushedEvents = (event: string) => app.pushed.filter((pushed) => pushed.event === event);
const documentNow = async () => ((await (await lena("join")).json()) as LiveDocument<NotesDocument>).document;
const lastLeases = () => pushedEvents("leases").at(-1)?.data.leases as DocumentLease[] | undefined;
const line1 = [["lines", "l1"]];

describe("a document of any kind", () => {
  it("a kind nobody plugged in is 404, and so is a document its owner hasn't got", async () => {
    expect((await app.send(`spaceship/${NOTE_ID}/join`, undefined, "c-lena", "u-lena")).status).toBe(404);
    expect((await app.send("note/no-such-note/join", undefined, "c-lena", "u-lena")).status).toBe(404);
  });

  it("these routes need a signed-in user, a client, and one that has joined", async () => {
    expect((await app.send(`note/${NOTE_ID}/join`, undefined, "c-lena", "none")).status).toBe(401);
    expect((await app.send(`note/${NOTE_ID}/join`, undefined, null, "u-lena")).status).toBe(400);
    expect((await lena("changes", { changes: [write("o1", "l1", "x")] })).status).toBe(404);
    expect((await lena("leases", { paths: line1, action: "acquire" })).status).toBe(404);
  });

  it("joining answers the document and who is on it; the room is named by kind and id", async () => {
    const joined = (await (await lena("join")).json()) as LiveDocument<NotesDocument>;
    expect(joined).toEqual({ document: {}, head: "v0", revision: 0, members: [{ clientId: "c-lena", actorId: "u-lena", actorName: "name of u-lena", actorImage: null }], leases: [], lock: null });
    expect(app.roomMembers.get(`doc:note:${NOTE_ID}`)).toEqual(new Map([["u-lena", 1]]));
  });

  it("an actor's last connection closing takes every tab of theirs off, and their leases with them", async () => {
    await lena("join");
    await app.send(`note/${NOTE_ID}/join`, undefined, "c-lena-2", "u-lena");
    await daniel("join");
    await lena("leases", { paths: line1, action: "acquire" });
    app.services.collaboration.dropActor("u-lena");
    await vi.waitFor(() => expect(lastLeases()).toEqual([]));
    await vi.waitFor(() => expect((pushedEvents("presence").at(-1)!.data.members as { clientId: string }[]).map((member) => member.clientId)).toEqual(["c-daniel"]));
    expect(app.roomMembers.get(`doc:note:${NOTE_ID}`)).toEqual(new Map([["u-daniel", 1]]));
  });

  it("one actor in two tabs joins the room once per tab, and stays in it until the last one leaves", async () => {
    await lena("join");
    await app.send(`note/${NOTE_ID}/join`, undefined, "c-lena-2", "u-lena");
    expect(app.roomMembers.get(`doc:note:${NOTE_ID}`)).toEqual(new Map([["u-lena", 2]]));
    await lena("leave");
    expect(app.roomMembers.get(`doc:note:${NOTE_ID}`)).toEqual(new Map([["u-lena", 1]]));
  });
});

describe("changes", () => {
  beforeEach(async () => { await lena("join"); await daniel("join"); });

  it("are ordered and pushed; a retried opId is applied once", async () => {
    const sent = { changes: [write("o1", "l1", "one")] };
    expect(await (await lena("changes", sent)).json()).toEqual({ revision: 1, refused: [], why: null, heldBy: null });
    expect(((await (await lena("changes", sent)).json()) as SentChanges).revision).toBe(1);
    await daniel("changes", { changes: [write("o2", "l1", "two")] });
    expect(pushedEvents("changes").map((event) => [event.data.clientId, event.data.revision])).toEqual([["c-lena", 1], ["c-daniel", 2]]);
    expect(await documentNow()).toEqual({ l1: "two" });
  });

  it("what the owner refuses is refused whole, with its reason", async () => {
    const answer = (await (await lena("changes", { changes: [write("o1", "l1", "fine"), write("o2", "l2", "forbidden")] })).json()) as SentChanges;
    expect(answer).toEqual({ revision: 0, refused: ["o1", "o2"], why: "that word isn't allowed", heldBy: null });
    expect(await documentNow()).toEqual({});
  });

  it("a change on a path someone else holds is refused, and says who", async () => {
    await lena("leases", { paths: line1, action: "acquire" });
    expect((await (await daniel("changes", { changes: [write("o1", "l1", "x")] })).json()) as SentChanges).toMatchObject({ refused: ["o1"], heldBy: "u-lena" });
    expect(((await (await lena("changes", { changes: [write("o2", "l1", "y")] })).json()) as SentChanges).refused).toEqual([]);
  });
});

describe("leases", () => {
  beforeEach(async () => { await lena("join"); await daniel("join"); });

  it("one editor per path, all or none, and only its holder releases it", async () => {
    await lena("leases", { paths: line1, action: "acquire" });
    expect(await (await daniel("leases", { paths: [["lines", "l2"], ...line1], action: "acquire" })).json()).toEqual({ granted: false, heldBy: "u-lena" });
    expect(lastLeases()).toHaveLength(1);
    await daniel("leases", { paths: line1, action: "release" });
    expect(lastLeases()).toHaveLength(1);
    await lena("leases", { paths: line1, action: "release" });
    expect(lastLeases()).toEqual([]);
  });

  it("expires without a renew", async () => {
    await lena("leases", { paths: line1, action: "acquire" });
    await vi.waitFor(() => expect(lastLeases()).toEqual([]));
  });

  it("a path that says no more than a section is 400", async () => {
    expect((await lena("leases", { paths: [["lines"]], action: "acquire" })).status).toBe(400);
  });
});

describe("what is stored", () => {
  it("quiet: one version once the changes stop, by who made the last, and the room hears the head", async () => {
    app = makeApp({ quietMs: 30 });
    await lena("join");
    await daniel("join");
    await lena("changes", { changes: [write("o1", "l1", "one")] });
    await daniel("changes", { changes: [write("o2", "l1", "two")] });
    expect(app.versions).toHaveLength(1);
    await vi.waitFor(() => expect(pushedEvents("saved")).toHaveLength(1));
    expect(app.versions.at(-1)).toMatchObject({ document: { l1: "two" }, author: "u-daniel" });
    expect(pushedEvents("saved")[0]!.data.head).toBe("v1");
  });

  it("the cap: a version though it never goes quiet", async () => {
    app = makeApp({ capMs: 30 });
    await lena("join");
    await lena("changes", { changes: [write("o1", "l1", "one")] });
    await vi.waitFor(() => expect(pushedEvents("saved")).toHaveLength(1));
  });

  it("asked: saved now, by who asked, with what they sent handed to the kind as it is; nothing changed, nothing saved", async () => {
    await lena("join");
    await daniel("join");
    expect(await (await lena("save", {})).json()).toEqual({ head: "v0", saved: false });
    await lena("changes", { changes: [write("o1", "l1", "one")] });
    expect(await (await daniel("save", { note: "A line" })).json()).toEqual({ head: "v1", saved: true });
    expect(app.versions.at(-1)).toMatchObject({ author: "u-daniel", note: "A line", document: { l1: "one" } });
    expect(pushedEvents("saved").at(-1)!.data.head).toBe("v1");
  });

  it("what the kind refuses isn't saved, and stays to be saved", async () => {
    await lena("join");
    await lena("changes", { changes: [write("o1", "l1", "one")] });
    expect((await lena("save", { note: "bad" })).status).toBe(422);
    expect(app.versions).toHaveLength(1);
    expect(await (await lena("save", {})).json()).toEqual({ head: "v1", saved: true });
  });

  it("nobody on the document: nothing to save; a kind nobody plugged in is 404", async () => {
    expect(await (await lena("save", {})).json()).toEqual({ head: "v0", saved: false });
    expect((await app.send(`spaceship/${NOTE_ID}/save`, {}, "c-lena", "u-lena")).status).toBe(404);
  });

  it("the last client gone: a version holds everything, and the next join reads it", async () => {
    await lena("join");
    await lena("changes", { changes: [write("o1", "l1", "one")] });
    await lena("leave");
    expect(app.versions).toHaveLength(2);
    expect(await documentNow()).toEqual({ l1: "one" });
  });

  it("a head moved outside the session resets the room, and what wasn't saved is dropped", async () => {
    await lena("join");
    await lena("changes", { changes: [write("o1", "l1", "unsaved")] });
    app.versions.push({ head: "restored", document: { l9: "from outside" }, author: "someone" });
    expect(await documentNow()).toEqual({ l9: "from outside" });
    expect(pushedEvents("reset").at(-1)!.data).toMatchObject({ head: "restored", document: { l9: "from outside" } });
  });
});

describe("a whole document from outside the session", () => {
  const writeWhole = (document: NotesDocument) => app.services.collaboration.writeWholeIfLive("note", NOTE_ID, document, "a-claude");

  it("nobody on it: nothing, it is its owner's to store", async () => {
    expect(await writeWhole({ l1: "x" })).toBeNull();
  });

  it("live: it goes in as changes, and the room hears them", async () => {
    await lena("join");
    expect(await writeWhole({ l1: "x" })).toEqual({ document: { l1: "x" }, head: "v0" });
    expect(pushedEvents("changes").at(-1)!.data.clientId).toBeNull();
  });

  it("a path someone holds is a conflict, what the owner refuses unprocessable", async () => {
    await lena("join");
    await lena("leases", { paths: line1, action: "acquire" });
    await expect(writeWhole({ l1: "x" })).rejects.toMatchObject({ status: 409 });
    await expect(writeWhole({ l2: "forbidden" })).rejects.toMatchObject({ status: 422 });
  });
});

describe("rules: a document that is no canvas", () => {
  // an outline: sections hold lines. Nothing here names a node or a frame
  type Outline = Record<string, { type: string; parent?: string; text: string }>;
  const outlineRules: DocumentRules<Outline> = {
    operationOf: (change) => (change.path.length === 2 && change.after === undefined ? { itemId: change.path[1]!, operation: "remove" } : change.path.length === 3 ? { itemId: change.path[1]!, operation: "rewrite" } : null),
    itemTypeOf: (document, itemId) => document[itemId]?.type ?? null,
    parentOf: (document, itemId) => document[itemId]?.parent ?? null,
    rulesOf: (itemType) => (itemType === "section" ? [
      { whileEditing: "descendants", blocks: ["remove"], target: "self" },
      { whileEditing: "self", blocks: ["rewrite"], target: "descendants" },
    ] : []),
  };
  const outline: Outline = { book: { type: "section", text: "" }, part: { type: "section", parent: "book", text: "" }, line1: { type: "line", parent: "part", text: "one" }, line2: { type: "line", parent: "part", text: "two" }, other: { type: "line", text: "free" } };
  const outlineKind: CollaborativeKind<Outline> = {
    kind: "outline",
    access: async () => true,
    rules: outlineRules,
    load: async () => ({ document: outline, head: "h0" }),
    applyChanges: (document) => document,
    diff: () => [],
    stillHolds: () => true,
    findRefusal: async () => null,
    save: async () => "h1",
  };
  const asLena = (action: string, body?: object) => app.send(`outline/o1/${action}`, body, "c-lena", "u-lena");
  const asDaniel = (action: string, body?: object) => app.send(`outline/o1/${action}`, body, "c-daniel", "u-daniel");
  const acquire = (itemId: string, operation: string) => ({ paths: [["items", itemId]], action: "acquire", operation });
  const removal = (itemId: string) => ({ changes: [{ opId: `remove-${itemId}`, path: ["items", itemId] }] });
  const rewrite = (itemId: string) => ({ changes: [{ opId: `rewrite-${itemId}`, path: ["items", itemId, "text"], after: "x" }] });

  beforeEach(async () => {
    app.services.collaboration.registerKind(outlineKind);
    await asLena("join");
    await asDaniel("join");
  });

  it("an item's rule on itself: removing a section is refused while something inside it is edited, at any depth", async () => {
    await asLena("leases", acquire("line1", "rewrite"));
    expect(await (await asDaniel("changes", removal("part"))).json()).toMatchObject({ refused: ["remove-part"], heldBy: "u-lena", why: "editing inside this section" });
    expect(await (await asDaniel("changes", removal("book"))).json()).toMatchObject({ heldBy: "u-lena", why: "editing inside this section" });
    expect(await (await asDaniel("leases", acquire("part", "remove"))).json()).toEqual({ granted: false, heldBy: "u-lena", why: "editing inside this section" });
  });

  it("what the rule doesn't list, a sibling, and what is outside are all free", async () => {
    await asLena("leases", acquire("line1", "rewrite"));
    expect(((await (await asDaniel("changes", rewrite("part"))).json()) as SentChanges).refused).toEqual([]);
    expect(((await (await asDaniel("changes", rewrite("line2"))).json()) as SentChanges).refused).toEqual([]);
    expect(((await (await asDaniel("changes", removal("other"))).json()) as SentChanges).refused).toEqual([]);
  });

  it("an ancestor's rule on its descendants: nothing inside is rewritten while the section is being edited", async () => {
    await asLena("leases", acquire("book", "move"));
    expect(await (await asDaniel("changes", rewrite("line1"))).json()).toMatchObject({ heldBy: "u-lena", why: "editing the section this is in" });
    expect(await (await asDaniel("leases", acquire("line1", "rewrite"))).json()).toMatchObject({ granted: false, why: "editing the section this is in" });
    expect(((await (await asDaniel("changes", removal("line1"))).json()) as SentChanges).refused).toEqual([]);
  });

  it("your own lease never stops you, and it ends with the lease", async () => {
    await asLena("leases", acquire("line1", "rewrite"));
    expect(((await (await asLena("changes", rewrite("part"))).json()) as SentChanges).refused).toEqual([]);
    expect(((await (await asLena("changes", removal("line2"))).json()) as SentChanges).refused).toEqual([]);
    await asLena("leases", { paths: [["items", "line1"]], action: "release" });
    expect(((await (await asDaniel("changes", removal("part"))).json()) as SentChanges).refused).toEqual([]);
  });

  it("a renew isn't checked, and a lease with no operation only meets the one-editor rule", async () => {
    await asDaniel("leases", acquire("part", "remove"));
    await asLena("leases", { paths: [["items", "line1"]], action: "acquire" });
    expect(await (await asDaniel("leases", { paths: [["items", "part"]], action: "renew", operation: "remove" })).json()).toEqual({ granted: true, heldBy: null });
  });

  it("a kind with no rules has only one editor per item", async () => {
    await lena("join");
    await daniel("join");
    await lena("leases", { paths: line1, action: "acquire" });
    expect(((await (await daniel("changes", { changes: [write("o9", "l2", "free")] })).json()) as SentChanges).refused).toEqual([]);
  });
});

describe("changes that only apply if nothing moved on", () => {
  const change = (opId: string, line: string, before: string | undefined, after: string): DocumentChange => ({ opId, path: ["lines", line], before, after });
  const ifUnchanged = (send: typeof lena, changes: DocumentChange[]) => send("changes", { changes, ifUnchanged: true });
  beforeEach(async () => {
    await lena("join");
    await daniel("join");
    await lena("changes", { changes: [change("a", "l1", undefined, "lena's")] });
  });

  it("applied and pushed when what is there is what they say was there", async () => {
    const answer = (await (await ifUnchanged(lena, [change("u", "l1", "lena's", "back")])).json()) as SentChanges;
    expect(answer).toMatchObject({ refused: [], heldBy: null, why: null });
    expect(await documentNow()).toEqual({ l1: "back" });
    expect(pushedEvents("changes").at(-1)!.data.clientId).toBe("c-lena");
  });

  it("refused when someone changed it since: says nobody, and nothing changes", async () => {
    await daniel("changes", { changes: [change("b", "l1", "lena's", "daniel's")] });
    const answer = (await (await ifUnchanged(lena, [change("u", "l1", "lena's", "back")])).json()) as SentChanges;
    expect(answer).toMatchObject({ refused: ["u"], heldBy: null, why: null });
    expect(await documentNow()).toEqual({ l1: "daniel's" });
  });

  it("each stands alone: the ones that still apply go through", async () => {
    await lena("changes", { changes: [change("c", "l2", undefined, "two")] });
    await daniel("changes", { changes: [change("d", "l2", "two", "daniel's")] });
    const answer = (await (await ifUnchanged(lena, [change("u1", "l1", "lena's", "back"), change("u2", "l2", "two", "back")])).json()) as SentChanges;
    expect(answer.refused).toEqual(["u2"]);
    expect(await documentNow()).toEqual({ l1: "back", l2: "daniel's" });
  });

  it("a later one checks against the earlier ones, as they apply in order", async () => {
    const answer = (await (await ifUnchanged(lena, [change("u1", "l1", "lena's", "middle"), change("u2", "l1", "middle", "back")])).json()) as SentChanges;
    expect(answer.refused).toEqual([]);
    expect(await documentNow()).toEqual({ l1: "back" });
  });

  it("someone holding it refuses that one and says who; the others go through", async () => {
    await lena("changes", { changes: [change("c", "l2", undefined, "two")] });
    await daniel("leases", { paths: [["lines", "l1"]], action: "acquire" });
    const answer = (await (await ifUnchanged(lena, [change("u1", "l1", "lena's", "back"), change("u2", "l2", "two", "back")])).json()) as SentChanges;
    expect(answer).toMatchObject({ refused: ["u1"], heldBy: "u-daniel", why: "editing this" });
    expect((await documentNow()).l2).toBe("back");
  });

  it("the owner refusing the result refuses all of what was left, and a retry is applied once", async () => {
    const refused = (await (await ifUnchanged(lena, [change("u1", "l1", "lena's", "forbidden")])).json()) as SentChanges;
    expect(refused).toMatchObject({ refused: ["u1"], why: "that word isn't allowed" });
    const sent = [change("u2", "l1", "lena's", "back")];
    await ifUnchanged(lena, sent);
    const revision = ((await (await lena("join")).json()) as LiveDocument<NotesDocument>).revision;
    expect(((await (await ifUnchanged(lena, sent)).json()) as SentChanges)).toMatchObject({ refused: [], revision });
  });

  it("a client that hasn't joined is 404", async () => {
    expect((await app.send(`note/${NOTE_ID}/changes`, { changes: [change("x", "l1", "a", "b")], ifUnchanged: true }, "c-stranger", "u-x")).status).toBe(404);
  });
});

describe("what the kind's owner allows", () => {
  const asReader = (action: string, body?: object) =>
    app.app.request(`/collaboration/note/${NOTE_ID}/${action}`, { method: "POST", headers: { "Content-Type": "application/json", "x-actor": "u-lena", "x-client": "c-lena", "x-access": "read" }, body: body ? JSON.stringify(body) : undefined });

  it("not readable: joining is a 404, so nobody learns it exists", async () => {
    const response = await app.app.request(`/collaboration/note/${NOTE_ID}/join`, { method: "POST", headers: { "x-actor": "u-lena", "x-client": "c-lena", "x-access": "none" } });
    expect(response.status).toBe(404);
  });

  it("read but not written: joining shows it, every lease, change and save is a 403", async () => {
    expect((await asReader("join")).status).toBe(200);
    expect((await asReader("leases", { paths: line1, action: "acquire" })).status).toBe(403);
    expect((await asReader("changes", { changes: [write("o1", "l1", "x")] })).status).toBe(403);
    expect((await asReader("changes", { changes: [write("o2", "l1", "x")], ifUnchanged: true })).status).toBe(403);
    expect((await asReader("save", {})).status).toBe(403);
    expect(await documentNow()).toEqual({});
  });
});

describe("a locked document", () => {
  const lockRow = { id: "lock-1", kind: "note", documentId: NOTE_ID, lockedBy: "u-mia", createdAt: new Date("2026-11-10T10:00:00Z") };
  const lockView = { id: "lock-1", kind: "note", documentId: NOTE_ID, title: null, lockedBy: "u-mia", lockedByName: "name of u-mia", lockedAt: "2026-11-10T10:00:00.000Z" };

  it("stored locked, it goes live locked: joining shows the lock, no lease and no change is taken", async () => {
    app.storedLocks.push(lockRow);
    const joined = (await (await lena("join")).json()) as LiveDocument<NotesDocument>;
    expect(joined.lock).toEqual(lockView);
    expect(await (await lena("leases", { paths: line1, action: "acquire" })).json()).toEqual({ granted: false, heldBy: "u-mia", why: "keeping this locked" });
    expect(await (await lena("changes", { changes: [write("o1", "l1", "x")] })).json()).toEqual({ revision: 0, refused: ["o1"], why: "keeping this locked", heldBy: "u-mia" });
    expect(await (await lena("changes", { changes: [write("o2", "l1", "x")], ifUnchanged: true })).json()).toMatchObject({ refused: ["o2"], why: "keeping this locked", heldBy: "u-mia" });
    expect(await documentNow()).toEqual({});
  });

  it("locked while live: the lock wins: what wasn't stored is dropped, every lease drops, and the room hears the reset and the lock", async () => {
    await lena("join");
    await daniel("join");
    await lena("leases", { paths: line1, action: "acquire" });
    await lena("changes", { changes: [write("o1", "l1", "before the lock")] });
    const versionsBefore = app.versions.length;
    await app.services.collaboration.applyLock("note", NOTE_ID, lockView);
    expect(app.versions).toHaveLength(versionsBefore);
    expect(lastLeases()).toEqual([]);
    expect(pushedEvents("reset").at(-1)!.data).toMatchObject({ document: {}, head: "v0" });
    expect(pushedEvents("lock").at(-1)!.data).toEqual({ lock: lockView });
    expect(await documentNow()).toEqual({});
    expect(await (await daniel("changes", { changes: [write("o2", "l2", "after")] })).json()).toMatchObject({ refused: ["o2"], why: "keeping this locked" });
    // leaving saves nothing either: there is nothing unstored left
    await lena("leave");
    await daniel("leave");
    expect(app.versions).toHaveLength(versionsBefore);
  });

  it("unlocked while live: the room hears it, and changes are taken again", async () => {
    app.storedLocks.push(lockRow);
    await lena("join");
    await app.services.collaboration.applyLock("note", NOTE_ID, null);
    expect(pushedEvents("lock").at(-1)!.data).toEqual({ lock: null });
    expect(await (await lena("changes", { changes: [write("o1", "l1", "free again")] })).json()).toMatchObject({ refused: [], heldBy: null });
  });

  it("a document nobody is editing: locking it touches nothing live, and those watching hear it", async () => {
    expect((await lena("watch")).status).toBe(200);
    expect(app.roomMembers.get(`doc:note:${NOTE_ID}`)).toEqual(new Map([["u-lena", 1]]));
    await app.services.collaboration.applyLock("note", NOTE_ID, lockView);
    expect(pushedEvents("lock").at(-1)).toMatchObject({ room: `doc:note:${NOTE_ID}`, data: { lock: lockView } });
    expect(pushedEvents("presence")).toEqual([]);
    await lena("unwatch");
    expect(app.roomMembers.get(`doc:note:${NOTE_ID}`)).toEqual(new Map());
  });

  it("watching answers who is editing it now, and hears the last one leave", async () => {
    expect(await (await lena("watch")).json()).toEqual({ watching: true, members: [] });
    await daniel("join");
    expect(await (await lena("watch")).json()).toEqual({
      watching: true,
      members: [{ clientId: "c-daniel", actorId: "u-daniel", actorName: "name of u-daniel", actorImage: null }],
    });
    await daniel("leave");
    expect(pushedEvents("presence").at(-1)).toMatchObject({ room: `doc:note:${NOTE_ID}`, data: { members: [] } });
    await lena("unwatch");
    await lena("unwatch");
  });

  it("watching asks for read, like joining", async () => {
    const response = await app.app.request(`/collaboration/note/${NOTE_ID}/watch`, { method: "POST", headers: { "x-actor": "u-lena", "x-client": "c-lena", "x-access": "none" } });
    expect(response.status).toBe(404);
  });
});
