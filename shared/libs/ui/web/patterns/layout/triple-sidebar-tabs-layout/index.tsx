import type { ReactNode } from "react";
import type { OnScrollDirection } from "../../../lib/scroll-direction";
import { Page, PageHeader, SecondPageHeader, PageBody } from "../../../primitives/layouts/page";
import { Main, MainContent, MainBody } from "../../../primitives/layouts/main";
import { PageLeftSidebar, MainRightSidebar } from "../../../primitives/layouts/sidebars";
import { ShellSideNav, ShellNav } from "../../../primitives/layouts/shell";
import { LOREM } from "../_lorem";
/** A layout pattern named by what it is, never by who uses it. Structure only: the regions, and one outlet per region a slice layout fills, named `<region>Content`. The theme owns every look. */
export interface TripleSidebarTabsLayoutProps {
  /** which regions go away, by name: each one that is true carries the flag `away`. The layout does not know why */
  away?: Partial<Record<"pageHeader" | "secondPageHeader" | "pageLeftSidebar" | "mainRightSidebar", boolean>>;
  /** told each time the main body's scroll turns: "down" or "up" */
  onScrollDirection?: OnScrollDirection;
  pageHeaderContent: ReactNode;
  secondPageHeaderContent: ReactNode;
  pageLeftSidebarContent: ReactNode;
  mainBodyContent: ReactNode;
  mainRightSidebarContent: ReactNode;
}

/** Shell nav (the shell's) + page header + second page header + page left sidebar + main + main right sidebar. The main takes the width that is left: it has no container. */
export function TripleSidebarTabsLayout({ away, onScrollDirection, pageHeaderContent, secondPageHeaderContent, pageLeftSidebarContent, mainBodyContent, mainRightSidebarContent }: TripleSidebarTabsLayoutProps) {
  return (
    <Page>
      <PageHeader away={away?.pageHeader}>{pageHeaderContent}</PageHeader>
      <SecondPageHeader away={away?.secondPageHeader}>{secondPageHeaderContent}</SecondPageHeader>
      <PageBody>
        <PageLeftSidebar away={away?.pageLeftSidebar}>{pageLeftSidebarContent}</PageLeftSidebar>
        <Main>
          <MainContent>
            <MainBody onScrollDirection={onScrollDirection}>{mainBodyContent}</MainBody>
            <MainRightSidebar away={away?.mainRightSidebar}>{mainRightSidebarContent}</MainRightSidebar>
          </MainContent>
        </Main>
      </PageBody>
    </Page>
  );
}

/** the pattern as a fixture: beside the shell nav, every outlet named, the main filled */
export default function Fixture() {
  return (
    <ShellSideNav>
      <ShellNav>shell-nav</ShellNav>
      <TripleSidebarTabsLayout pageHeaderContent="page-header" secondPageHeaderContent="second-page-header" pageLeftSidebarContent="page-left-sidebar" mainBodyContent={LOREM} mainRightSidebarContent="main-right-sidebar" />
    </ShellSideNav>
  );
}
