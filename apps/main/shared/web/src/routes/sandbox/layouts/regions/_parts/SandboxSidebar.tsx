// =============================================================================
// Sandbox sidebar — coloured filler + unstyled nav (no component library chrome)
// =============================================================================

const NAV_ITEMS = ["Dashboard", "Settings", "Users", "Reports", "Documents"];

export function SandboxSidebar() {
  return (
    <div
      style={{
        background: "#b8e0cc",
        color: "#1a3a28",
        width: 240,
        display: "flex",
        flexDirection: "column",
        padding: "12px 16px",
        boxSizing: "border-box",
        gap: 12,
        height: "100%",
      }}
    >
      <span style={{ fontFamily: "monospace", fontSize: 11, opacity: 0.6 }}>layout=</span>
      <strong style={{ fontFamily: "monospace", fontSize: 14 }}>"shell-nav"</strong>
      <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 13, lineHeight: 2 }}>
        {NAV_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
