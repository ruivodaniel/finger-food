type Props = {
  value: unknown;
  inherited?: unknown;
  onChange: (v: unknown) => void;
  placeholder?: string;
  className?: string;
};

/**
 * String input. Italic when inherited.
 * Matches reference: text-[11px], h-[22px], border-zinc-200, bg-white.
 */
export function TextField({
  value,
  inherited,
  onChange,
  placeholder = "\u2014",
  className,
}: Props) {
  const s = value != null ? String(value) : undefined;
  const inh = inherited != null ? String(inherited) : undefined;
  const display = s ?? inh ?? "";
  const isLocal = s != null;

  return (
    <input
      type="text"
      value={display}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder={placeholder}
      className={`text-[11px] rounded border border-zinc-200 bg-white h-[22px] px-1.5 ${
        isLocal
          ? "text-zinc-900"
          : "text-zinc-400 italic"
      } ${className ?? "w-full"}`}
    />
  );
}
