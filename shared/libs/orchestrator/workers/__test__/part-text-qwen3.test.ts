import { describe, expect, it, vi } from "vitest";
import { makeCtx } from "./harness";

const create = vi.fn();
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: (...args: unknown[]) => create(...args) } };
  },
}));

const { run } = await import("../part-text-qwen3/v1/worker");

const cfg = { maxTokens: 100, temperature: 0, thinking: false, timeoutMs: 1000 };
const deps = { apiKey: "k", baseUrl: "http://x", chatModel: "qwen3:8b" };
const tool = { name: "get_organization", description: "Get one.", parameters: { type: "object" } };
const conversation = (tools = [tool]) => ({
  type: "type-structured-content" as const,
  value: { messages: [{ role: "user" as const, content: "Who is in Acme?" }], tools },
});

/** The chunks of a streamed completion, as the SDK yields them. */
async function* chunks(...list: unknown[]) {
  yield* list;
}
const text = (content: string) => ({ choices: [{ delta: { content } }] });

describe("part-text-qwen3", () => {
  it("returns the answer with thinking off, and reports tokens", async () => {
    create.mockResolvedValueOnce(chunks(text("Acme has "), text("2 members."),{ choices: [{ delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 30, completion_tokens: 5 } }));
    const { ctx, reports } = await makeCtx(deps);

    const out = await run({ conversation: conversation() }, cfg, ctx);

    expect(out.reply).toEqual({ type: "type-structured-content", value: { content: "Acme has 2 members.", toolCalls: [], finishReason: "stop" } });
    const request = create.mock.calls.at(-1)![0];
    expect(request).toMatchObject({ model: "qwen3:8b", reasoning_effort: "none", stream: true });
    expect(request.tools).toHaveLength(1);
    expect(reports[0]).toMatchObject({ measured: "reported", tokens: { input: 30, output: 5 } });
  });

  it("assembles a tool call from its pieces and drops calls to functions not offered", async () => {
    create.mockResolvedValueOnce(
      chunks(
        { choices: [{ delta: { tool_calls: [{ index: 0, id: "c1", function: { name: "get_organization", arguments: '{"organiz' } }] } }] },
        { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'ationName":"Acme"}' } }] } }] },
        { choices: [{ delta: { tool_calls: [{ index: 1, id: "c2", function: { name: "delete_everything", arguments: "{}" } }] } }] },
        { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
      ),
    );
    const { ctx } = await makeCtx(deps);

    const out = await run({ conversation: conversation() }, cfg, ctx);

    expect("value" in out.reply && out.reply.value.toolCalls).toEqual([{ id: "c1", name: "get_organization", arguments: { organizationName: "Acme" } }]);
  });

  it("offers no tools when there are none", async () => {
    create.mockResolvedValueOnce(chunks(text("Done.")));
    const { ctx } = await makeCtx(deps);

    await run({ conversation: conversation([]) }, cfg, ctx);

    expect(create.mock.calls.at(-1)![0].tools).toBeUndefined();
  });
});
