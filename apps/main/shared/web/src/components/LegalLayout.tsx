/**
 * LegalLayout — the public legal documents: no navigation (shell-none), the
 * document in the page's main column. The structure is PageLayout's.
 */
import { ShellNone } from "@libs/web-layouts";
import { Outlet } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { PageLayout } from "@/components/PageLayout";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function LegalLayout() {
  return (
    <ShellNone>
      <PageLayout>{createElement(RouterOutlet)}</PageLayout>
    </ShellNone>
  );
}
