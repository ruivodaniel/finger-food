import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatMessageSelect, ChatSelect } from "../models/chat.model";
import type { ChatRepository, NewMessage, PageCursor } from "../repositories/chat.repository";
import { ChatService, FAILED_ANSWER_TEXT, type StartRun } from "./chat.service";

/** The repository over arrays, newest-first reads included, so the service runs without a database. */
class InMemoryChatRepository implements Pick<ChatRepository, keyof ChatRepository> {
  chats: ChatSelect[] = [];
  messages: ChatMessageSelect[] = [];
  private nextId = 1;
  /** Each row is written one second after the one before, so the order is unambiguous. */
  private clock = Date.now();

  private now() {
    this.clock += 1000;
    return new Date(this.clock);
  }

  async insertChat(input: { userId: string; organizationId: string | null; title: string }) {
    const now = this.now();
    const row = { id: `chat-${this.nextId++}`, ...input, createdAt: now, updatedAt: now };
    this.chats.push(row);
    return row;
  }

  async findChat(chatId: string) {
    return this.chats.find((c) => c.id === chatId);
  }

  async findChatsByUserId(userId: string, cursor: PageCursor | undefined, limit: number) {
    return this.chats
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .filter((c) => !cursor || c.updatedAt < cursor.time)
      .slice(0, limit);
  }

  async findMessages(chatId: string, cursor: PageCursor | undefined, limit: number) {
    return this.newestFirst(chatId)
      .filter((m) => !cursor || m.createdAt < cursor.time)
      .slice(0, limit)
      .map((message) => {
        const question = this.messages.find((q) => q.id === message.replyTo);
        return { message, question: question ? { id: question.id, content: question.content } : null };
      });
  }

  async findMessage(chatId: string, messageId: string) {
    return this.messages.find((m) => m.chatId === chatId && m.id === messageId);
  }

  async findLastMessages(chatId: string, limit: number) {
    return this.newestFirst(chatId).slice(0, limit).reverse();
  }

  async insertMessage(input: NewMessage) {
    const stored = input.replyTo ? this.messages.find((m) => m.replyTo === input.replyTo) : undefined;
    if (stored) return stored;
    const row = { id: `msg-${this.nextId++}`, ...input, createdAt: this.now() };
    this.messages.push(row);
    const chat = this.chats.find((c) => c.id === input.chatId);
    if (chat) chat.updatedAt = row.createdAt;
    return row;
  }

  async setMessageRunId(messageId: string, runId: string) {
    const message = this.messages.find((m) => m.id === messageId);
    if (message) message.runId = runId;
  }

  async findPendingChats() {
    return [];
  }

  private newestFirst(chatId: string) {
    return this.messages
      .filter((m) => m.chatId === chatId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

class TestError extends Error {
  constructor(
    readonly status: number,
    message?: string,
  ) {
    super(message);
  }
}

const errors = {
  notFound: (message?: string) => new TestError(404, message),
  badRequest: (message?: string) => new TestError(400, message),
  unauthorized: (message?: string) => new TestError(401, message),
  conflict: (message?: string) => new TestError(409, message),
  internalError: (message?: string) => new TestError(500, message),
};
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

const alice = { userId: "alice", activeOrganizationId: "org-1", roles: ["member"] };
const bob = { userId: "bob", activeOrganizationId: null, roles: [] };

let repo: InMemoryChatRepository;
let startRun: ReturnType<typeof vi.fn<StartRun>>;
let service: ChatService;

beforeEach(() => {
  repo = new InMemoryChatRepository();
  startRun = vi.fn<StartRun>(async () => ({ runId: "run-1" }));
  service = new ChatService({ chatRepo: repo, startRun, errors, logger });
});

/** Answers the chat's last user message, as the open API does when the run ends. */
async function answerLastMessage(userId: string, chatId: string, content = "an answer") {
  const question = repo.messages.filter((m) => m.chatId === chatId && m.role === "user").at(-1)!;
  return service.complete(userId, chatId, question.id, { status: "complete", content });
}

describe("start", () => {
  it("creates the chat titled after the first 60 characters, with the active organization", async () => {
    const content = "  " + "x".repeat(80);
    const { chat, message } = await service.start(alice, content);

    expect(chat.title).toBe("x".repeat(60));
    expect(chat.organizationId).toBe("org-1");
    expect(message).toMatchObject({ chatId: chat.id, role: "user", content });
  });

  it("starts the run with the stored message, an empty history and the bag, and records the run id", async () => {
    const { chat, message } = await service.start(alice, "hello");

    expect(startRun).toHaveBeenCalledWith({ chatId: chat.id, messageId: message.id, prompt: "hello", history: [], bag: alice });
    expect(repo.messages[0].runId).toBe("run-1");
  });

  it("stores an error answer and fails when the run cannot start", async () => {
    startRun.mockRejectedValueOnce(new Error("orchestrator down"));

    await expect(service.start(alice, "hello")).rejects.toMatchObject({ status: 500 });
    expect(repo.messages).toHaveLength(2);
    expect(repo.messages[1]).toMatchObject({ role: "assistant", status: "error", content: FAILED_ANSWER_TEXT, replyTo: repo.messages[0].id });
  });
});

describe("send", () => {
  it("is refused while the last message is the user's and less than 5 minutes old", async () => {
    const { chat } = await service.start(alice, "first");

    await expect(service.send(alice, chat.id, "second")).rejects.toMatchObject({ status: 409 });
  });

  it("is accepted once the last message is answered, with the complete messages as history", async () => {
    const { chat } = await service.start(alice, "first");
    await answerLastMessage("alice", chat.id, "first answer");
    await service.send(alice, chat.id, "second");
    await service.complete("alice", chat.id, repo.messages.at(-1)!.id, { status: "error" });
    await service.send(alice, chat.id, "third");

    expect(startRun).toHaveBeenLastCalledWith(
      expect.objectContaining({
        prompt: "third",
        history: [
          { role: "user", content: "first" },
          { role: "assistant", content: "first answer" },
          { role: "user", content: "second" },
        ],
      }),
    );
  });

  it("gives the run at most the last 20 messages", async () => {
    const { chat } = await service.start(alice, "q0");
    await answerLastMessage("alice", chat.id);
    for (let i = 1; i <= 15; i++) {
      await service.send(alice, chat.id, `q${i}`);
      await answerLastMessage("alice", chat.id);
    }
    await service.send(alice, chat.id, "last");

    const { history } = startRun.mock.lastCall![0];
    expect(history).toHaveLength(20);
    expect(history[0]).toEqual({ role: "user", content: "q6" });
  });

  it("answers another user's chat as missing", async () => {
    const { chat } = await service.start(alice, "first");

    await expect(service.send(bob, chat.id, "hi")).rejects.toMatchObject({ status: 404 });
  });
});

describe("complete", () => {
  it("stores the answer once: a second answer gets the stored one back", async () => {
    const { chat, message } = await service.start(alice, "question");

    const first = await service.complete("alice", chat.id, message.id, { status: "complete", content: "answer" });
    const second = await service.complete("alice", chat.id, message.id, { status: "complete", content: "another" });

    expect(second).toEqual(first);
    expect(first).toMatchObject({ role: "assistant", content: "answer", question: { id: message.id, content: "question" } });
    expect(repo.messages).toHaveLength(2);
  });

  it("stores a failure as the fixed message", async () => {
    const { chat, message } = await service.start(alice, "question");

    const stored = await service.complete("alice", chat.id, message.id, { status: "error" });

    expect(stored).toMatchObject({ status: "error", content: FAILED_ANSWER_TEXT });
  });

  it("refuses an assistant message, and another user's chat, as missing", async () => {
    const { chat, message } = await service.start(alice, "question");
    const answer = await service.complete("alice", chat.id, message.id, { status: "complete", content: "a" });

    await expect(service.complete("alice", chat.id, answer.id, { status: "error" })).rejects.toMatchObject({ status: 404 });
    await expect(service.complete("bob", chat.id, message.id, { status: "error" })).rejects.toMatchObject({ status: 404 });
  });
});

describe("list and messages", () => {
  it("lists the user's chats a page at a time, most recently updated first", async () => {
    const titles = ["a", "b", "c"];
    for (const title of titles) {
      const { chat } = await service.start(alice, title);
      await answerLastMessage("alice", chat.id);
    }
    await service.start(bob, "not alice's");

    const first = await service.list("alice", { limit: 2 });
    expect(first.chats.map((c) => c.title)).toEqual(["c", "b"]);
    expect(first.nextCursor).not.toBeNull();

    const second = await service.list("alice", { limit: 2, cursor: first.nextCursor! });
    expect(second.chats.map((c) => c.title)).toEqual(["a"]);
    expect(second.nextCursor).toBeNull();
  });

  it("reads messages from the newest page back, oldest first within a page", async () => {
    const { chat } = await service.start(alice, "q1");
    await answerLastMessage("alice", chat.id, "a1");
    await service.send(alice, chat.id, "q2");
    await answerLastMessage("alice", chat.id, "a2");

    const newest = await service.messages("alice", chat.id, { limit: 3 });
    expect(newest.messages.map((m) => m.content)).toEqual(["a1", "q2", "a2"]);
    expect(newest.messages[2].question).toEqual({ id: newest.messages[1].id, content: "q2" });

    const older = await service.messages("alice", chat.id, { limit: 3, cursor: newest.nextCursor! });
    expect(older.messages.map((m) => m.content)).toEqual(["q1"]);
    expect(older.nextCursor).toBeNull();
  });

  it("refuses a cursor that does not decode", async () => {
    await expect(service.list("alice", { limit: 10, cursor: "not-a-cursor" })).rejects.toMatchObject({ status: 400 });
  });

  it("does not read another user's chat", async () => {
    const { chat } = await service.start(alice, "q1");

    await expect(service.get("bob", chat.id)).rejects.toMatchObject({ status: 404 });
    await expect(service.messages("bob", chat.id, { limit: 10 })).rejects.toMatchObject({ status: 404 });
  });
});
