/**
 * PatternsLayout — the slice layout of the implementation patterns' pages: the single-sidebar application layout with the
 * page's title band (by path) and the page in the main container.
 */
import { Outlet, useLocation } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { SingleSidebarLayout } from "@libs/web-layouts";
import { TitleHeader } from "@modules/shared/web";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

const title = (pathname: string): { icon: "star" | "activity"; title: string } => {
  if (pathname.endsWith("/minesweeper")) return { icon: "activity", title: "Massive minesweeper" };
  if (pathname.endsWith("/meteors/new")) return { icon: "star", title: "New meteor" };
  if (/\/meteors\/[^/]+\/edit$/.test(pathname)) return { icon: "star", title: "Edit meteor" };
  if (/\/meteors\/[^/]+$/.test(pathname)) return { icon: "star", title: "Meteor" };
  if (pathname.endsWith("/meteors")) return { icon: "star", title: "Meteors" };
  return { icon: "activity", title: "Implementation patterns" };
};

export function PatternsLayout() {
  const pathname = useLocation({ select: (l) => l.pathname });
  return (
    <SingleSidebarLayout
      pageHeaderContent={<TitleHeader {...title(pathname)} />}
      mainContainerContent={createElement(RouterOutlet)}
    />
  );
}
