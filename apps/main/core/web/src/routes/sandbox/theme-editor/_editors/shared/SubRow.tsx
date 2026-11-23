import type { ReactNode } from "react";

type Props = {
  label?: string;
  children?: ReactNode;
};

/**
 * Indented detail row (22px left margin) for expanded per-corner / per-side values.
 * Matches reference: min-h-[26px], ml-[22px].
 */
export function SubRow({ label, children }: Props) {
  return (
    <div className="flex items-center gap-1.5 min-h-[26px] ml-[22px]">
      {label && (
        <span className="text-[9px] text-zinc-400 w-10 shrink-0">
          {label}
        </span>
      )}
      <div className="flex-1 min-w-0 flex items-center gap-1">{children}</div>
    </div>
  );
}
