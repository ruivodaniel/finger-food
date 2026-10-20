/**
 * SandboxControls — floating dev panel for sandbox toggles.
 *
 * LINT EXEMPTION: This file uses hardcoded dark-panel styling on purpose.
 * It's a dev tool overlay that must stay visually stable and contrast
 * against whatever theme/layout is being tested in the sandbox.
 *
 * All hardcoded colors (#111, #7c9, etc.) and inline styles live here.
 * Callers pass state + handlers; this component handles rendering.
 */

import * as React from "react";

export type ShellVariant = "side-nav" | "top-nav" | "none";

interface Props {
  shell: ShellVariant;
  onShell: (v: ShellVariant) => void;
  show: Record<string, boolean>;
  onToggle: (key: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  showColors: boolean;
  showText: boolean;
  onToggleColors: () => void;
  onToggleText: () => void;
}

export function SandboxControls({
  shell, onShell, show, onToggle, collapsed, onToggleCollapsed, showColors, showText, onToggleColors, onToggleText,
}: Props) {
  const [open, setOpen] = React.useState(true);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: "#111",
        color: "#fff",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        minWidth: 220,
        fontFamily: "monospace",
        fontSize: 13,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: "#222",
          color: "#fff",
          border: "none",
          padding: "10px 14px",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: 13,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>layout sandbox</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Shell — radio */}
          <div>
            <div style={{ opacity: 0.5, marginBottom: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Shell</div>
            {(["side-nav", "top-nav", "none"] as ShellVariant[]).map((v) => {
              const active = shell === v;
              return (
                <div
                  key={v}
                  onClick={() => onShell(v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    marginBottom: 4, padding: "5px 8px", borderRadius: 6,
                    cursor: "pointer",
                    background: active ? "#7c9" : "transparent",
                    color: active ? "#000" : "#aaa",
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{active ? "◉" : "○"}</span>
                  {`shell-${v}`}
                </div>
              );
            })}
          </div>

          {/* Page regions — checkboxes */}
          <div>
            <div style={{ opacity: 0.5, marginBottom: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Page regions</div>
            {["page-header", "left-sidebar", "main-header", "main-footer", "context-panel", "right-sidebar"].map((key) => {
              const on = show[key] ?? true;
              return (
                <React.Fragment key={key}>
                  <div
                    onClick={() => onToggle(key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      marginBottom: 4, padding: "5px 8px", borderRadius: 6,
                      cursor: "pointer",
                      background: on ? "#7c9" : "transparent",
                      color: on ? "#000" : "#555",
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{on ? "☑" : "☐"}</span>
                    {key}
                  </div>
                  {key === "left-sidebar" && on && (
                    <div
                      onClick={onToggleCollapsed}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        marginBottom: 4, marginLeft: 18, padding: "5px 8px", borderRadius: 6,
                        cursor: "pointer",
                        background: collapsed ? "#7c9" : "transparent",
                        color: collapsed ? "#000" : "#555",
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{collapsed ? "☑" : "☐"}</span>
                      collapsed
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Display toggles */}
          <div>
            <div style={{ opacity: 0.5, marginBottom: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Display</div>
            {[
              { key: "colors", label: "colors", on: showColors, cb: onToggleColors },
              { key: "text", label: "text", on: showText, cb: onToggleText },
            ].map(({ key, label, on, cb }) => (
              <div
                key={key}
                onClick={cb}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  marginBottom: 4, padding: "5px 8px", borderRadius: 6,
                  cursor: "pointer",
                  background: on ? "#7c9" : "transparent",
                  color: on ? "#000" : "#555",
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{on ? "☑" : "☐"}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
