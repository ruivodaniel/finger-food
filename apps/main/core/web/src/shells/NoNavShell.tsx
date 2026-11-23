/**
 * NoNavShell — the shell with no navigation (shell-none): the page slot alone. What stands in it (a centered card for the
 * sign-in pages, a document on its own) is the slice layout's.
 */
import { ShellNone } from "@libs/web-layouts";
import { Outlet } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function NoNavShell() {
  return <ShellNone>{createElement(RouterOutlet)}</ShellNone>;
}
