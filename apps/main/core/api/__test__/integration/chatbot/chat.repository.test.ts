// The chat repository's SQL against a real Postgres (PGlite, in-memory): the
// keyset pages, the question joined to its answer, an answer stored once, and
// the pending chats a resync reads. The tables come from the generated
// migration, so the test runs on the schema the app migrates to.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { ChatRepository, type ChatbotDb } from "@modules/chatbot/api";

const MIGRATIONS = join(__dirname, "../../../drizzle");

async function makeRepo() {
  const client = new PGlite();
  const migration = readdirSync(MIGRATIONS).find((f) => f.endsWith(".sql") && readFileSync(join(MIGRATIONS, f), "utf8").includes('CREATE TABLE "chat"'))!;
  for (const statement of readFileSync(join(MIGRATIONS, migration), "utf8").split("--> statement-breakpoint")) {
    await client.exec(statement);
  }
  let id = 0;
  return new ChatRepository({ db: drizzle(client) as unknown as ChatbotDb, createId: () => `id-${String(++id).padStart(3, "0")}` });
}

const userMessage = (chatId: string, content: string) =>
  ({ chatId, role: "user", content, replyTo: null, runId: null, status: "complete" }) as const;
const answerTo = (chatId: string, replyTo: string, content: string) =>
  ({ chatId, role: "assistant", content, replyTo, runId: null, status: "complete" }) as const;

let repo: ChatRepository;

beforeEach(async () => {
  repo = await makeRepo();
});

describe("ChatRepository", () => {
  it("reads a user's chats a page at a time, most recently updated first", async () => {
    const a = await repo.insertChat({ userId: "alice", organizationId: null, title: "a" });
    const b = await repo.insertChat({ userId: "alice", organizationId: null, title: "b" });
    await repo.insertChat({ userId: "bob", organizationId: null, title: "bob's" });
    await repo.insertMessage(userMessage(a.id, "moves a to the top"));

    const first = await repo.findChatsByUserId("alice", undefined, 1);
    expect(first.map((c) => c.title)).toEqual(["a"]);

    const second = await repo.findChatsByUserId("alice", { time: first[0].updatedAt, id: first[0].id }, 10);
    expect(second.map((c) => c.id)).toEqual([b.id]);
  });

  it("reads messages newest first from a cursor, each answer with its question", async () => {
    const chat = await repo.insertChat({ userId: "alice", organizationId: null, title: "t" });
    const q1 = await repo.insertMessage(userMessage(chat.id, "q1"));
    await repo.insertMessage(answerTo(chat.id, q1.id, "a1"));
    const q2 = await repo.insertMessage(userMessage(chat.id, "q2"));
    const a2 = await repo.insertMessage(answerTo(chat.id, q2.id, "a2"));

    const newest = await repo.findMessages(chat.id, undefined, 1);
    expect(newest).toEqual([{ message: a2, question: { id: q2.id, content: "q2" } }]);

    const older = await repo.findMessages(chat.id, { time: a2.createdAt, id: a2.id }, 10);
    expect(older.map((r) => r.message.content)).toEqual(["q2", "a1", "q1"]);
    expect(older.at(-1)?.question).toBeNull();
  });

  it("stores one answer per user message, and moves the chat's updated time to the last message", async () => {
    const chat = await repo.insertChat({ userId: "alice", organizationId: null, title: "t" });
    const question = await repo.insertMessage(userMessage(chat.id, "q"));

    const first = await repo.insertMessage(answerTo(chat.id, question.id, "first"));
    const second = await repo.insertMessage(answerTo(chat.id, question.id, "second"));

    expect(second).toEqual(first);
    expect(await repo.findLastMessages(chat.id, 10)).toEqual([question, first]);
    expect((await repo.findChat(chat.id))?.updatedAt).toEqual(first.createdAt);
  });

  it("records the run id on a user message", async () => {
    const chat = await repo.insertChat({ userId: "alice", organizationId: null, title: "t" });
    const question = await repo.insertMessage(userMessage(chat.id, "q"));

    await repo.setMessageRunId(question.id, "run-1");

    expect((await repo.findMessage(chat.id, question.id))?.runId).toBe("run-1");
  });

  it("finds the chats with a recent user message still unanswered", async () => {
    const answered = await repo.insertChat({ userId: "alice", organizationId: null, title: "answered" });
    const pending = await repo.insertChat({ userId: "bob", organizationId: null, title: "pending" });
    const q = await repo.insertMessage(userMessage(answered.id, "q"));
    await repo.insertMessage(answerTo(answered.id, q.id, "a"));
    await repo.insertMessage(userMessage(pending.id, "q"));

    expect(await repo.findPendingChats(new Date(Date.now() - 60_000))).toEqual([{ chatId: pending.id, userId: "bob" }]);
    expect(await repo.findPendingChats(new Date(Date.now() + 60_000))).toEqual([]);
  });
});
