/**
 * StandaloneLayout — the slice layout of a page that stands alone under the sidebar shell: the single-sidebar application layout,
 * the page's own title band (STANDALONE_PAGE_HEADERS, by path), the page in the main container.
 */
import { Outlet, useLocation } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { SingleSidebarLayout } from "@libs/web-layouts";
import { TitleHeader } from "@modules/shared/web";
import { STANDALONE_PAGE_HEADERS } from "../../routes/sections";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function StandaloneLayout() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const header = STANDALONE_PAGE_HEADERS[pathname.replace(/\/+$/, "") || "/"];
  return (
    <SingleSidebarLayout
      scale="sm"
      pageHeaderContent={header ? <TitleHeader icon={header.icon} title={header.title} /> : null}
      mainContainerContent={createElement(RouterOutlet)}
    />
  );
}
