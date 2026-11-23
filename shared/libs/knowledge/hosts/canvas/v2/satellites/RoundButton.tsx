// A round button on the edge of a node, on hover: what the node can do (edit, settings; a previewer-editor brings its own through its registration's satellites)
import { Button } from "../../../../../ui/web/primitives/components/button/v1";

export function RoundButton({ icon, label, testid, onClick, disabled, title }: { icon: string; label: string; testid: string; onClick?: () => void; disabled?: boolean; title?: string }) {
  return <span title={title} onClick={disabled ? undefined : onClick} style={{ display: "inline-flex", width: 22, height: 22, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#fff", border: "1px solid rgba(0,0,0,.14)", boxShadow: "0 1px 3px rgba(0,0,0,.16)", cursor: disabled ? "not-allowed" : "pointer", overflow: "hidden", opacity: disabled ? 0.45 : 1 }}>
    <Button buttonType="icon" startIcon={icon as never} emphasis="tertiary" scale="xs" aria-label={label} data-testid={testid} disabled={disabled} />
  </span>;
}
