// One conversation turn through Qwen3 on an OpenAI-compatible endpoint (Ollama
// locally): the model's answer, or the functions it asks for, assembled from
// the stream's pieces. Ollama keeps any reasoning out of the answer text (in
// its own field, which is not read), so the text needs no cleaning.
import OpenAI from "openai";
import { z } from "zod";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { WorkerRun } from "@libs/orchestrator-lib-schema";
import type * as contract from "./contract";
import type { Message, Tool, ToolCall } from "./contract";

function toOpenAiMessage(message: Message): ChatCompletionMessageParam {
  if (message.role === "tool") return { role: "tool", tool_call_id: message.toolCallId, content: message.content };
  if (message.role === "assistant" && message.toolCalls?.length) {
    return {
      role: "assistant",
      content: message.content || null,
      tool_calls: message.toolCalls.map((call) => ({
        id: call.id,
        type: "function",
        function: { name: call.name, arguments: JSON.stringify(call.arguments) },
      })),
    };
  }
  return { role: message.role, content: message.content };
}

function toOpenAiTool(tool: Tool): ChatCompletionTool {
  return { type: "function", function: { name: tool.name, description: tool.description, parameters: tool.parameters } };
}

const callArguments = z.record(z.string(), z.unknown());

/** A call's arguments: the JSON object the model wrote, or none when it wrote anything else. */
function parseArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = callArguments.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export const run: WorkerRun<typeof contract> = async (input, cfg, ctx) => {
  if (!("value" in input.conversation)) throw new Error("the conversation must be sent inline");
  const { messages, tools } = input.conversation.value;
  const model = cfg.model ?? ctx.deps.chatModel;
  const client = new OpenAI({ apiKey: ctx.deps.apiKey, baseURL: ctx.deps.baseUrl, timeout: cfg.timeoutMs, maxRetries: 0 });
  const started = performance.now();

  const stream = await client.chat.completions.create({
    model,
    max_tokens: cfg.maxTokens,
    temperature: cfg.temperature,
    // Ollama turns Qwen3's thinking off with "none"
    ...(cfg.thinking ? {} : { reasoning_effort: "none" as const }),
    messages: messages.map(toOpenAiMessage),
    ...(tools.length ? { tools: tools.map(toOpenAiTool) } : {}),
    stream: true,
    stream_options: { include_usage: true },
  });

  let content = "";
  // a call arrives in pieces, keyed by its index in the reply
  const calls = new Map<number, { id: string; name: string; arguments: string }>();
  let finishReason: string | null = null;
  let usage: { prompt_tokens: number; completion_tokens: number } | undefined;

  for await (const chunk of stream) {
    if (chunk.usage) usage = chunk.usage;
    const choice = chunk.choices[0];
    if (!choice) continue;
    if (choice.finish_reason) finishReason = choice.finish_reason;
    if (choice.delta.content) content += choice.delta.content;
    for (const piece of choice.delta.tool_calls ?? []) {
      const call = calls.get(piece.index) ?? { id: `call_${piece.index}`, name: "", arguments: "" };
      if (piece.id) call.id = piece.id;
      if (piece.function?.name) call.name += piece.function.name;
      if (piece.function?.arguments) call.arguments += piece.function.arguments;
      calls.set(piece.index, call);
    }
  }

  ctx.report({
    measured: usage ? "reported" : "observed",
    calls: 1,
    model,
    tokens: usage ? { input: usage.prompt_tokens, output: usage.completion_tokens } : undefined,
    compute: { wallMs: Math.round(performance.now() - started) },
  });

  // A call to a function that was not offered is not a call: with no tools, the model must answer.
  const offered = new Set(tools.map((tool) => tool.name));
  const toolCalls: ToolCall[] = [...calls.values()]
    .filter((call) => offered.has(call.name))
    .map((call) => ({ id: call.id, name: call.name, arguments: parseArguments(call.arguments) }));

  return { reply: { type: "type-structured-content", value: { content: content.trim(), toolCalls, finishReason } } };
};
