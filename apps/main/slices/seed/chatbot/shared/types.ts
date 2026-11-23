// What the chatbot's API and web sides share: the views the API answers with,
// what a run receives, and the message length limit.

/** The longest message a user can send. */
export const MESSAGE_MAX_LENGTH = 4_000;

export type MessageRole = "user" | "assistant";
export type MessageStatus = "complete" | "error";

export interface Chat {
  id: string;
  title: string;
  /** The organization active when the chat started; null without one. */
  organizationId: string | null;
  createdAt: string;
  /** The time of the last message: the order of the chat list. */
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  /** On an answer, the user message it replies to, even when that message is on another page. */
  question: { id: string; content: string } | null;
  createdAt: string;
}

export interface ChatPage {
  chats: Chat[];
  /** null on the last page. */
  nextCursor: string | null;
}

export interface MessagePage {
  /** Oldest first. */
  messages: ChatMessage[];
  /** null when there is nothing older. */
  nextCursor: string | null;
}

/** Who the run acts for: the signed-in user, their active organization and their roles. */
export interface RunBag {
  userId: string;
  activeOrganizationId: string | null;
  roles: string[];
}

/** One message of the conversation a run receives as its history. */
export interface HistoryMessage {
  role: MessageRole;
  content: string;
}
