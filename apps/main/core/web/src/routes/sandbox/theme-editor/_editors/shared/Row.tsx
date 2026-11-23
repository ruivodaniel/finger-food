import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  label?: string;
  children: ReactNode;
  right?: ReactNode;
};

/**
 * 26px-height editor row.
 *   layout: [icon 16px?] [label 44px?] [children flex-1] [right?]
 *
 * The icon slot is OMITTED entirely when no icon is passed (saves 22px on
 * every label-only row — important in a 240px property panel).
 *
 * The label slot is OMITTED entirely when no label is passed (saves 50px).
 */
export function Row({ icon, label, children, right }: Props) {
  return (
    <div className={`flex items-center gap-1.5 min-h-[26px] ${icon ? "" : "pl-3"}`}>
      {icon && (
        <span className="w-4 shrink-0 flex items-center justify-center text-zinc-400">
          {icon}
        </span>
      )}
      {label && (
        <span className="text-[10px] text-zinc-500 w-[44px] shrink-0 truncate">
          {label}
        </span>
      )}
      <div className="flex-1 min-w-0 flex items-center gap-1">{children}</div>
      {right && <span className="shrink-0">{right}</span>}
    </div>
  );
}
