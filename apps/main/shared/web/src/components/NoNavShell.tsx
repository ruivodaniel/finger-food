/**
 * NoNavShell — the shell with no navigation (shell-none): the page centered in
 * the viewport, in a card. Login, registration, recovery and the invitation
 * pages sit in it.
 */
import { AuthPage } from "@libs/web-layouts";
import { Card, CardContent } from "@libs/web-components";
import { Outlet } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function NoNavShell() {
  return (
    <AuthPage>
      <Card className="w-full max-w-md">
        <CardContent>{createElement(RouterOutlet)}</CardContent>
      </Card>
    </AuthPage>
  );
}
