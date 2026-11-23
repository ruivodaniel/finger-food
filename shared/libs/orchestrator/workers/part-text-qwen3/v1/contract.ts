import { z } from "zod";
import { type WorkerMeta, slot } from "@libs/orchestrator-lib-schema";

export const meta: WorkerMeta = { capability: "part-text", vendor: "qwen3", operation: "chat.completions.create, streamed, with tools (OpenAI-compatible, Ollama)", runtimes: ["server"] };

// One turn of a conversation: the model answers, or names the functions whose
// data it needs. How the model is run is config.
export const config = z.object({
  /** absent = the runner's `chatModel` */
  model: z.string().optional(),
  maxTokens: z.number().int().positive().max(8192).default(1024),
  temperature: z.number().min(0).max(2).default(0.3),
  /** Qwen3 reasons before it answers: much slower, and the reasoning spends maxTokens */
  thinking: z.boolean().default(false),
  /** the endpoint answers or the step fails, no silent client retries */
  timeoutMs: z.number().int().positive().default(3 * 60_000),
});

const toolCall = z.object({ id: z.string(), name: z.string(), arguments: z.record(z.string(), z.unknown()) });

const message = z.discriminatedUnion("role", [
  z.object({ role: z.literal("system"), content: z.string() }),
  z.object({ role: z.literal("user"), content: z.string() }),
  z.object({ role: z.literal("assistant"), content: z.string(), toolCalls: z.array(toolCall).optional() }),
  z.object({ role: z.literal("tool"), toolCallId: z.string(), content: z.string() }),
]);

const tool = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
  description: z.string(),
  /** the JSON Schema of the function's arguments */
  parameters: z.record(z.string(), z.unknown()),
});

export const conversation = z.object({
  messages: z.array(message).min(1),
  /** the functions the model may call; empty = it must answer */
  tools: z.array(tool).max(32),
});

export const reply = z.object({
  content: z.string(),
  /** only calls to functions that were offered */
  toolCalls: z.array(toolCall),
  finishReason: z.string().nullable(),
});

/** the OpenAI-compatible endpoint (Ollama locally) and the model a turn uses when the config names none */
export const deps = z.object({ apiKey: z.string().min(1), baseUrl: z.string().url(), chatModel: z.string().min(1) });

export const input = {
  conversation: slot("type-structured-content", { formats: ["format-json"], schema: conversation }),
};

export const output = {
  reply: slot("type-structured-content", { formats: ["format-json"], schema: reply }),
};

export type Message = z.infer<typeof message>;
export type Tool = z.infer<typeof tool>;
export type ToolCall = z.infer<typeof toolCall>;
export type Reply = z.infer<typeof reply>;
