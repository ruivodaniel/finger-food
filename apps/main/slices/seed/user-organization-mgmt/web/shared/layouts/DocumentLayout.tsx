/**
 * DocumentLayout — the slice layout of a document read on its own, no navigation: the bare application layout with the page in
 * the main container (the public legal documents).
 */
import { Outlet } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { BareLayout } from "@libs/web-layouts";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function DocumentLayout() {
  return <BareLayout scale="sm" mainContainerContent={createElement(RouterOutlet)} />;
}
