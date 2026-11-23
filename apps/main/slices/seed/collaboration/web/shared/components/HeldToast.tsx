// Says who is editing a node someone tried to edit.
export function HeldToast({ text }: { text: string }) {
  return (
    <div role="status" data-testid="held-toast" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50, padding: "8px 14px", borderRadius: 6, background: "var(--color-gray-900, #222)", color: "var(--color-gray-50, #fff)" }}>
      <span element="type--body-small">{text}</span>
    </div>
  );
}
