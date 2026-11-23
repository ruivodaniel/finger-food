import type { ReactNode } from "react";
import type { OnScrollDirection } from "../../../lib/scroll-direction";
import { Page, PageHeader, SecondPageHeader, PageBody } from "../../../primitives/layouts/page";
import { Main, MainContent, MainBody } from "../../../primitives/layouts/main";
import { MainContainer, type ContainerScale } from "../../../primitives/layouts/container";
import { ShellSideNav, ShellNav } from "../../../primitives/layouts/shell";
import { LOREM } from "../_lorem";
/** A layout pattern named by what it is, never by who uses it. Structure only: the regions, and one outlet per region a slice layout fills, named `<region>Content`. The theme owns every look. */
export interface SingleSidebarTabsLayoutProps {
  /** which regions go away, by name: each one that is true carries the flag `away`. The layout does not know why */
  away?: Partial<Record<"pageHeader" | "secondPageHeader", boolean>>;
  /** told each time the main body's scroll turns: "down" or "up" */
  onScrollDirection?: OnScrollDirection;
  /** the main container's measure; the theme gives each scale its width */
  scale?: ContainerScale;
  pageHeaderContent: ReactNode;
  secondPageHeaderContent: ReactNode;
  mainContainerContent: ReactNode;
}

/** Shell nav (the shell's) + page header + second page header + main. The second page header is the row of tabs of a page with several views. */
export function SingleSidebarTabsLayout({ away, onScrollDirection, scale, pageHeaderContent, secondPageHeaderContent, mainContainerContent }: SingleSidebarTabsLayoutProps) {
  return (
    <Page>
      <PageHeader away={away?.pageHeader}>{pageHeaderContent}</PageHeader>
      <SecondPageHeader away={away?.secondPageHeader}>{secondPageHeaderContent}</SecondPageHeader>
      <PageBody>
        <Main>
          <MainContent>
            <MainBody onScrollDirection={onScrollDirection}>
              <MainContainer scale={scale}>{mainContainerContent}</MainContainer>
            </MainBody>
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
      <SingleSidebarTabsLayout pageHeaderContent="page-header" secondPageHeaderContent="second-page-header" mainContainerContent={LOREM} />
    </ShellSideNav>
  );
}
