// The code block's options, on top of it when it is the one thing selected: its language, its font size and the line numbers. Nothing else; they are the block's, not the canvas's.
import { InputSelect } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { LANGUAGES } from "./spec";
import { GLYPHS } from "../../hosts/canvas/v3/tools/glyphs";
import type { Switches } from "../../hosts/canvas/v3/canvas-registration";

export type CodeOptions = { language: string; fontSize: string; showLineNumbers: boolean };
const step = (n: number, by: number) => String(Math.min(200, Math.max(4, n + by)));
const arrow = (up: boolean) => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={up ? "M3 7.5 6 4.5 9 7.5" : "M3 4.5 6 7.5 9 4.5"} /></svg>;

export function CodeBlockOptions({ switches: s, onChange }: { switches: Switches; onChange: (p: Partial<CodeOptions>) => void }) {

  const language = String(s.language ?? "javascript"), size = Number(s.fontSize) || 14, numbers = s.showLineNumbers !== false;
  return (
    <Stack dir="row" scale="2xs" align="center" data-testid="code-options">
      <div style={{ width: 150 }} title="language"><InputSelect options={LANGUAGES.map((x) => ({ value: x, label: x }))} value={language} clearable={false} onChange={(v: string | null) => v && onChange({ language: v })} /></div>
      <Stack dir="row" scale="3xs" align="center" title="font size">
        <input type="number" min={4} max={200} value={size} data-testid="code-font-size" onChange={(e) => onChange({ fontSize: step(Number(e.target.value) || size, 0) })} style={{ width: 52, textAlign: "center" }} />
        <Stack dir="col">
          <button type="button" aria-label="bigger" onClick={() => onChange({ fontSize: step(size, 1) })} style={{ border: "none", background: "transparent", cursor: "pointer", lineHeight: 0, padding: 2 }}>{arrow(true)}</button>
          <button type="button" aria-label="smaller" onClick={() => onChange({ fontSize: step(size, -1) })} style={{ border: "none", background: "transparent", cursor: "pointer", lineHeight: 0, padding: 2 }}>{arrow(false)}</button>
        </Stack>
      </Stack>
      <button type="button" aria-label="line numbers" title={`line numbers: ${numbers ? "on" : "off"}`} data-testid="code-line-numbers" onClick={() => onChange({ showLineNumbers: !numbers })}
        style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 6, cursor: "pointer", background: numbers ? "rgba(0,0,0,.12)" : "transparent", color: "var(--foreground, #1a1a1a)" }}>{GLYPHS.linenumbers}</button>
    </Stack>
  );
}
