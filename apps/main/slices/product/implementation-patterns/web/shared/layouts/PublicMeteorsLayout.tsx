/**
 * PublicMeteorsLayout — the slice layout of the public meteor pages, no session, no navigation: the bare application layout.
 */
import { Outlet } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { BareLayout } from "@libs/web-layouts";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function PublicMeteorsLayout() {
  return <BareLayout mainContainerContent={createElement(RouterOutlet)} />;
}
