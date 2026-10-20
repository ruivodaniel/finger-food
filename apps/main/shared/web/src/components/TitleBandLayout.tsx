/**
 * TitleBandLayout — the default layout of a signed-in page: a title band that
 * carries the page's title and icon (declared on its route as
 * `staticData.header`; pages render no title of their own), then the page in
 * the main column. Settings and the org area add a left panel (see
 * SettingsLayout.tsx and OrgLayout.tsx); the structure is PageLayout's.
 */

import { type IconName } from "@libs/web-components";
import { PageLayout } from "@/components/PageLayout";
import { TitleHeader } from "@/components/TitleHeader";
import { Outlet, useMatches } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";

/** What a route puts in the frame's header band. */
export interface PageHeaderSpec {
  title: string;
  icon: IconName;
}

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    header?: PageHeaderSpec;
  }
}

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function TitleBandLayout() {
  // The deepest matched route that declares a header.
  const header = useMatches({
    select: (matches) =>
      [...matches].reverse().find((m) => m.staticData?.header)?.staticData
        .header,
  });

  return (
    <PageLayout header={header && <TitleHeader icon={header.icon} title={header.title} />}>
      {createElement(RouterOutlet)}
    </PageLayout>
  );
}
