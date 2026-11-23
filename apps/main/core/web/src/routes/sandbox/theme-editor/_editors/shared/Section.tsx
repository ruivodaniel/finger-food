import type { ReactNode } from "react";

type Props = {
  title: string;
  /** Optional content rendered on the right of the section header (e.g. "+" add button). */
  actions?: ReactNode;
  /** Reserved for future collapsible behavior — currently ignored, sections are always open. */
  defaultOpen?: boolean;
  children: ReactNode;
};

/**
 * Section header with dense Figma-style layout.
 * Uppercase 10px header in muted bg, content in padded container.
 *
 * Pass `actions` to render header-side affordances (e.g. an add button).
 */
export function Section({ title, actions, children }: Props) {
  return (
    <div className="border-b border-zinc-100">
      <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50 flex items-center justify-between gap-2">
        <span className="truncate">{title}</span>
        {actions && <span className="shrink-0">{actions}</span>}
      </div>
      <div className="px-2 py-2 space-y-1.5">{children}</div>
    </div>
  );
}
