/**
 * SettingsLayout — the slice layout of the caller's settings: the double-sidebar application layout, the "Settings" title band in
 * the page header, the settings nav in the page left sidebar, the section's pages in the main container through the router outlet.
 * The nav is fed the projection of the route declaration and the router's current path.
 */
import { Outlet, useLocation } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { DoubleSidebarLayout } from "@libs/web-layouts";
import { TitleHeader } from "@modules/shared/web";
import { navOf, type RouteNode } from "@libs/web-routing";
import { SettingsNav } from "../components/SettingsNav";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

/** The settings section node, set by the route declaration once built (get-routes.ts): the nav reads its children. */
let settingsSection: RouteNode | null = null;
export function registerSettingsSection(node: RouteNode): void {
  settingsSection = node;
}

export function SettingsLayout() {
  const current = useLocation({ select: (l) => l.pathname });
  const entries = settingsSection ? navOf(settingsSection) : [];
  return (
    <DoubleSidebarLayout
      scale="sm"
      pageHeaderContent={<TitleHeader icon="settings" title="Settings" />}
      pageLeftSidebarContent={<SettingsNav entries={entries} current={current} />}
      mainContainerContent={createElement(RouterOutlet)}
    />
  );
}
