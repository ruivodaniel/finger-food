// A round button on the edge of a node, on hover: what the node can do (edit, settings; a previewer-editor brings its own through its registration's satellites)
import { Button } from "@libs/web-components";

export function RoundButton({ icon, label, testid, onClick, disabled, title }: { icon: string; label: string; testid: string; onClick?: () => void; disabled?: boolean; title?: string }) {
  return <span title={title} onClick={disabled ? undefined : onClick} style={{ display: "inline-flex", width: 22, height: 22, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--background)", border: `1px solid var(--border)`, boxShadow: `0 1px 3px color-mix(in srgb, var(--foreground) 16%, transparent)`, cursor: disabled ? "not-allowed" : "pointer", overflow: "hidden", opacity: disabled ? 0.45 : 1 }}>
    <Button buttonType="icon" startIcon={icon as never} emphasis="tertiary" scale="xs" aria-label={label} data-testid={testid} disabled={disabled} />
  </span>;
}
