import type { ReactNode } from "react";
import type { OnScrollDirection } from "../../../lib/scroll-direction";
import { Page, PageHeader, PageBody, PageFooter } from "../../../primitives/layouts/page";
import { Main, MainContent, MainBody } from "../../../primitives/layouts/main";
import { MainContainer, type ContainerScale } from "../../../primitives/layouts/container";
import { PageLeftSidebar } from "../../../primitives/layouts/sidebars";
import { ShellSideNav, ShellNav } from "../../../primitives/layouts/shell";
import { LOREM } from "../_lorem";
/** A layout pattern named by what it is, never by who uses it. Structure only: the regions, and one outlet per region a slice layout fills, named `<region>Content`. The theme owns every look. */
export interface DoubleSidebarFooterLayoutProps {
  /** which regions go away, by name: each one that is true carries the flag `away`. The layout does not know why */
  away?: Partial<Record<"pageHeader" | "pageFooter" | "pageLeftSidebar", boolean>>;
  /** told each time the main body's scroll turns: "down" or "up" */
  onScrollDirection?: OnScrollDirection;
  /** the main container's measure; the theme gives each scale its width */
  scale?: ContainerScale;
  pageHeaderContent: ReactNode;
  pageLeftSidebarContent: ReactNode;
  mainContainerContent: ReactNode;
  pageFooterContent: ReactNode;
}

/** Shell nav (the shell's) + page header + page left sidebar + main + page footer. The footer runs under the sidebar and the main. */
export function DoubleSidebarFooterLayout({ away, onScrollDirection, scale, pageHeaderContent, pageLeftSidebarContent, mainContainerContent, pageFooterContent }: DoubleSidebarFooterLayoutProps) {
  return (
    <Page>
      <PageHeader away={away?.pageHeader}>{pageHeaderContent}</PageHeader>
      <PageBody>
        <PageLeftSidebar away={away?.pageLeftSidebar}>{pageLeftSidebarContent}</PageLeftSidebar>
        <Main>
          <MainContent>
            <MainBody onScrollDirection={onScrollDirection}>
              <MainContainer scale={scale}>{mainContainerContent}</MainContainer>
            </MainBody>
          </MainContent>
        </Main>
      </PageBody>
      <PageFooter away={away?.pageFooter}>{pageFooterContent}</PageFooter>
    </Page>
  );
}

/** the pattern as a fixture: beside the shell nav, every outlet named, the main filled */
export default function Fixture() {
  return (
    <ShellSideNav>
      <ShellNav>shell-nav</ShellNav>
      <DoubleSidebarFooterLayout pageHeaderContent="page-header" pageLeftSidebarContent="page-left-sidebar" mainContainerContent={LOREM} pageFooterContent="page-footer" />
    </ShellSideNav>
  );
}
