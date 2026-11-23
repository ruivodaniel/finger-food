import { describe, expect, it, vi } from "vitest";
import { makeCtx, putUpload } from "./harness";

const create = vi.fn();
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: (...args: unknown[]) => create(...args) } };
  },
}));

const { run, stripFence, PROMPTS } = await import("../image-to-text-qwen25-vl/v1/worker");

const cfg = { output: "format-plaintext" as const, instructions: "Transcribe.", model: "qwen2.5vl:3b", maxTokens: 100, temperature: 0, concurrency: 2, timeoutMs: 1000 };

describe("image-to-text-qwen25-vl", () => {
  it("transcribes each image to a text artifact in input order and reports tokens", async () => {
    create.mockImplementation(async (req: { messages: { content: { image_url?: { url: string } }[] }[] }) => {
      const url = req.messages[0]!.content[1]!.image_url!.url;
      const which = Buffer.from(url.split(",")[1]!, "base64").toString();
      return { choices: [{ message: { content: `\`\`\`\ntext of ${which}\n\`\`\`` } }], usage: { prompt_tokens: 10, completion_tokens: 4 } };
    });
    const { ctx, artifacts, reports } = await makeCtx({ apiKey: "k", baseUrl: "http://x" });
    const a = await putUpload(artifacts, "1.png", new TextEncoder().encode("A"), "format-png");
    const b = await putUpload(artifacts, "2.png", new TextEncoder().encode("B"), "format-png");
    b.meta = { page: 7 };

    const out = await run({ image: [a, b] }, cfg, ctx);

    expect(out.text).toHaveLength(2);
    expect(new TextDecoder().decode(artifacts.objects.get(out.text[0]!.ref))).toBe("text of A");
    expect(out.text[1]?.ref).toBe("orch/derived/runs/run1/step/7.txt");
    expect(out.text[1]?.meta?.page).toBe(7);
    expect(reports).toHaveLength(2);
    expect(reports[0]?.tokens).toEqual({ input: 10, output: 4 });
    expect(reports[0]?.measured).toBe("reported");
  });

  it("in markdown mode asks for the page's structure and writes .md files", async () => {
    create.mockReset();
    create.mockResolvedValue({ choices: [{ message: { content: "# Schedule\n\n| Agreement number | B0572 |\n|---|---|" } }], usage: { prompt_tokens: 10, completion_tokens: 20 } });
    const { ctx, artifacts } = await makeCtx({ apiKey: "k", baseUrl: "http://x" });
    const a = await putUpload(artifacts, "1.png", new TextEncoder().encode("A"), "format-png");

    const out = await run({ image: [a] }, { ...cfg, output: "format-markdown", instructions: undefined }, ctx);

    const prompt = (create.mock.calls[0]![0] as { messages: { content: { text?: string }[] }[] }).messages[0]!.content[0]!.text;
    expect(prompt).toBe(PROMPTS["format-markdown"]);
    expect(out.text[0]?.format).toBe("format-markdown");
    expect(out.text[0]?.ref).toBe("orch/derived/runs/run1/step/1.md");
    expect(new TextDecoder().decode(artifacts.objects.get(out.text[0]!.ref))).toContain("| Agreement number | B0572 |");
  });

  it("strips a code fence but leaves plain text alone", () => {
    expect(stripFence("```text\nhello\n```")).toBe("hello");
    expect(stripFence("  hello  ")).toBe("hello");
  });
});
