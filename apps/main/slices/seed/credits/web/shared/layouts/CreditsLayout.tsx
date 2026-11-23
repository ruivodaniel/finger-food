/**
 * CreditsLayout — the slice layout of the organization's credits and the credit grants: the single-sidebar application layout
 * with the page's title band (by path) and the page in the main container.
 */
import { Outlet, useLocation } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import type { IconName } from "@libs/web-components";
import { SingleSidebarLayout } from "@libs/web-layouts";
import { TitleHeader } from "@modules/shared/web";
import { creditsPaths } from "../../../shared/paths";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

function headerOf(pathname: string): { title: string; icon: IconName } {
  if (pathname.startsWith(creditsPaths.creditGrants)) return { title: "Credit grants", icon: "star" };
  return { title: "Credits", icon: "activity" };
}

export function CreditsLayout() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const { title, icon } = headerOf(pathname);
  return (
    <SingleSidebarLayout
      pageHeaderContent={<TitleHeader icon={icon} title={title} />}
      mainContainerContent={createElement(RouterOutlet)}
    />
  );
}
