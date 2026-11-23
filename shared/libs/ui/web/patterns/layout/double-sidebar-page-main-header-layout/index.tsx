import type { ReactNode } from "react";
import type { OnScrollDirection } from "../../../lib/scroll-direction";
import { Page, PageHeader, PageBody } from "../../../primitives/layouts/page";
import { Main, MainHeader, MainContent, MainBody } from "../../../primitives/layouts/main";
import { PageLeftSidebar } from "../../../primitives/layouts/sidebars";
import { ShellSideNav, ShellNav } from "../../../primitives/layouts/shell";
import { LOREM } from "../_lorem";
/** A layout pattern named by what it is, never by who uses it. Structure only: the regions, and one outlet per region a slice layout fills, named `<region>Content`. The theme owns every look. */
export interface DoubleSidebarPageMainHeaderLayoutProps {
  /** which regions go away, by name: each one that is true carries the flag `away`. The layout does not know why */
  away?: Partial<Record<"pageHeader" | "pageLeftSidebar" | "mainHeader", boolean>>;
  /** told each time the main body's scroll turns: "down" or "up" */
  onScrollDirection?: OnScrollDirection;
  pageHeaderContent: ReactNode;
  pageLeftSidebarContent: ReactNode;
  mainHeaderContent: ReactNode;
  mainBodyContent: ReactNode;
}

/** Shell nav (the shell's) + page header + page left sidebar + main with its own header. The page header runs over the sidebar and the main; the main header (tabs, a sub-bar) belongs to the main only. */
export function DoubleSidebarPageMainHeaderLayout({ away, onScrollDirection, pageHeaderContent, pageLeftSidebarContent, mainHeaderContent, mainBodyContent }: DoubleSidebarPageMainHeaderLayoutProps) {
  return (
    <Page>
      <PageHeader away={away?.pageHeader}>{pageHeaderContent}</PageHeader>
      <PageBody>
        <PageLeftSidebar away={away?.pageLeftSidebar}>{pageLeftSidebarContent}</PageLeftSidebar>
        <Main>
          <MainHeader away={away?.mainHeader}>{mainHeaderContent}</MainHeader>
          <MainContent>
            <MainBody onScrollDirection={onScrollDirection}>{mainBodyContent}</MainBody>
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
      <DoubleSidebarPageMainHeaderLayout pageHeaderContent="page-header" pageLeftSidebarContent="page-left-sidebar" mainHeaderContent="main-header" mainBodyContent={LOREM} />
    </ShellSideNav>
  );
}
