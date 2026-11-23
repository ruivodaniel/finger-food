/**
 * PropertyPanelShell — chrome around the property panel content.
 *
 * LINT EXEMPTION: This file uses bare divs with overflow-y-auto and
 * layout styling. The property panel chrome must stay visually stable
 * while the theme being edited changes — it can't use @libs/web-layouts
 * primitives because those are themed.
 *
 * THEME ISOLATION RULE: This file may NOT use any themed Tailwind class
 * (text-foreground, bg-background, border-border, text-muted-foreground,
 * bg-muted, bg-card, etc.). All colors come from Tailwind's static palette.
 */

import type { ReactNode } from "react";

type Props = {
  breadcrumb: string;
  title: string;
  children: ReactNode;
};

export function PropertyPanelShell({
  breadcrumb,
  title,
  children,
}: Props) {
  return (
    <div className="flex flex-col overflow-y-auto bg-white text-zinc-900">
      {/* Header: breadcrumb + title */}
      <div className="border-b border-zinc-200 bg-zinc-50 shrink-0">
        <div className="px-3 pt-2 pb-1">
          <div className="text-[10px] text-zinc-400">{breadcrumb}</div>
          <div className="text-[13px] font-semibold text-zinc-900 mt-0.5">
            {title}
          </div>
        </div>
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

/**
 * Empty state placeholder — shown when nothing is selected.
 * Also part of the chrome (visually stable).
 */
export function PropertyPanelEmpty() {
  return (
    <div className="flex items-center justify-center h-full p-6 bg-white">
      <p className="text-sm text-zinc-400 text-center">
        Select an item from the navigator to edit its properties.
      </p>
    </div>
  );
}
