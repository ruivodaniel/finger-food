/**
 * LocksLayout — the slice layout of the locks page: the single-sidebar application layout with its title band and the page in
 * the main container.
 */
import { Outlet } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { SingleSidebarLayout } from "@libs/web-layouts";
import { TitleHeader } from "@modules/shared/web";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function LocksLayout() {
  return <SingleSidebarLayout pageHeaderContent={<TitleHeader icon="lock" title="Locks" />} mainContainerContent={createElement(RouterOutlet)} />;
}
