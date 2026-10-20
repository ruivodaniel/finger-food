/**
 * SandboxSwatch — coloured filler block for layout region visualization.
 *
 * LINT EXEMPTION: This file uses hardcoded hex colors and inline styles
 * on purpose. The layouts sandbox needs per-region visual differentiation
 * that is independent of the theme being previewed — if it used theme
 * tokens, changing the theme would recolor the demonstration blocks and
 * defeat the purpose of the sandbox.
 *
 * ONE shared component. All hardcoded colors live here. Callers pass
 * `region` and display flags; this component handles the rest.
 */

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis
unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam
rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae
vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur
aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem
sequi nesciunt. `.repeat(40);

const REGION_COLORS: Record<string, string> = {
  "shell-top-nav":  "#b8d4e8",
  "shell-side-nav": "#b8e0cc",
  "shell-none":     "#d4c8e8",
  "page-header":    "#f0dfc0",
  "left-sidebar":   "#c0d8f0",
  "main-header":    "#f0c8d4",
  "container":      "#e8e4f0",
  "context-panel":  "#dcc8f0",
  "right-sidebar":  "#c8e8d8",
};

const REGION_TEXT: Record<string, string> = {
  "shell-top-nav":  "#1a3a52",
  "shell-side-nav": "#1a3a28",
  "shell-none":     "#2e1a52",
  "page-header":    "#52380a",
  "left-sidebar":   "#0a2852",
  "main-header":    "#52182a",
  "container":      "#2a2452",
  "context-panel":  "#3a1452",
  "right-sidebar":  "#0a3828",
};

export interface SandboxSwatchProps {
  region: string;
  showColors: boolean;
  showText: boolean;
}

export function SandboxSwatch({ region, showColors, showText }: SandboxSwatchProps) {
  const bg = showColors ? (REGION_COLORS[region] ?? "#e8e8e8") : "transparent";
  const fg = showColors ? (REGION_TEXT[region] ?? "#222") : "#999";
  return (
    <div
      style={{
        background: bg,
        color: fg,
        minHeight: 0,
        overflow: "hidden",
        padding: "12px 16px",
        boxSizing: "border-box",
        transition: "background 0.2s",
      }}
    >
      {showText && (
        <>
          <span style={{ fontFamily: "monospace", fontSize: 11, opacity: 0.6 }}>layout=</span>
          <strong style={{ fontFamily: "monospace", fontSize: 14 }}>{`"${region}"`}</strong>
          <p style={{ fontSize: 12, opacity: 0.6, lineHeight: 1.6, marginTop: 8 }}>{LOREM}</p>
        </>
      )}
    </div>
  );
}
