// A grid of colour swatches, as Miro's: none (a slash), then the palette; the current one ticked.
import { PALETTE } from "./types";

export function Swatches({ value, onChange, none = true }: { value: string; onChange: (c: string) => void; none?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 28px)", gap: 8 }}>
      {PALETTE.filter((c) => none || c !== "transparent").map((c) => (
        <button key={c} type="button" title={c === "transparent" ? "none" : c} onClick={() => onChange(c)} data-testid={`swatch-${c}`}
          style={{ width: 28, height: 28, borderRadius: 14, padding: 0, cursor: "pointer", position: "relative", background: c === "transparent" ? "#fff" : c, border: "1px solid rgba(0,0,0,.15)", boxShadow: value === c ? "0 0 0 2px var(--primary, #4338ca)" : undefined }}>
          {c === "transparent" ? <span style={{ position: "absolute", left: 3, right: 3, top: 13, height: 1.5, background: "#999", transform: "rotate(-45deg)" }} /> : null}
        </button>
      ))}
    </div>
  );
}
/** the trigger of a colour popover: a circle of the colour (a ring for a border, an underlined A for text) */
export function SwatchTrigger({ kind, color, label, ...rest }: { kind: "fill" | "ring" | "text"; color: string; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} title={label} {...rest} style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", borderRadius: 6, cursor: "pointer" }}>
      {kind === "text" ? <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", fontWeight: 700, fontSize: 15, lineHeight: 1 }}>A<span style={{ width: 16, height: 3, marginTop: 2, background: color, border: "1px solid rgba(0,0,0,.15)" }} /></span>
        : kind === "ring" ? <span style={{ width: 18, height: 18, borderRadius: 9, border: `3px solid ${color === "transparent" ? "#ccc" : color}` }} />
        : <span style={{ width: 18, height: 18, borderRadius: 9, border: "1px solid rgba(0,0,0,.2)", background: color === "transparent" ? "repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0 0 / 8px 8px" : color }} />}
    </button>
  );
}
