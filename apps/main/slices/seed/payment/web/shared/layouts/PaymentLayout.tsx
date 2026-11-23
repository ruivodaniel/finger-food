/**
 * PaymentLayout — the slice layout of the marketplace, selling and organization billing: the single-sidebar
 * application layout with the page's title band (by path) and the page in the main container.
 */
import { Outlet, useLocation } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import type { IconName } from "@libs/web-components";
import { SingleSidebarLayout } from "@libs/web-layouts";
import { TitleHeader } from "@modules/shared/web";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

function headerOf(pathname: string): { title: string; icon: IconName } {
  if (pathname.endsWith("/billing")) return { title: "Billing", icon: "tag" };
  if (pathname.endsWith("/selling")) return { title: "Selling", icon: "package" };
  return { title: "Marketplace", icon: "grid" };
}

export function PaymentLayout() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const { title, icon } = headerOf(pathname);
  return (
    <SingleSidebarLayout
      pageHeaderContent={<TitleHeader icon={icon} title={title} />}
      mainContainerContent={createElement(RouterOutlet)}
    />
  );
}
