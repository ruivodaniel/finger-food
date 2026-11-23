import type { ReactNode } from "react";
import type { OnScrollDirection } from "../../../lib/scroll-direction";
import { Page, PageHeader, PageBody } from "../../../primitives/layouts/page";
import { Main, MainContent, MainBody } from "../../../primitives/layouts/main";
import { MainContainer, type ContainerScale } from "../../../primitives/layouts/container";
import { ShellSideNav, ShellNav } from "../../../primitives/layouts/shell";
import { LOREM } from "../_lorem";
/** A layout pattern named by what it is, never by who uses it. Structure only: the regions, and one outlet per region a slice layout fills, named `<region>Content`. The theme owns every look. */
export interface SingleSidebarLayoutProps {
  /** which regions go away, by name: each one that is true carries the flag `away`. The layout does not know why */
  away?: Partial<Record<"pageHeader", boolean>>;
  /** told each time the main body's scroll turns: "down" or "up" */
  onScrollDirection?: OnScrollDirection;
  /** the main container's measure; the theme gives each scale its width */
  scale?: ContainerScale;
  pageHeaderContent: ReactNode;
  mainContainerContent: ReactNode;
}

/** Shell nav (the shell's) + page header + main. The layout of a page that stands alone in a section. */
export function SingleSidebarLayout({ away, onScrollDirection, scale, pageHeaderContent, mainContainerContent }: SingleSidebarLayoutProps) {
  return (
    <Page>
      <PageHeader away={away?.pageHeader}>{pageHeaderContent}</PageHeader>
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

/** the pattern as a fixture: beside the shell nav, every outlet named, the container filled */
export default function Fixture() {
  return (
    <ShellSideNav className="flex h-screen w-full overflow-hidden">
      <ShellNav className="flex h-full flex-col">shell-nav</ShellNav>
      <SingleSidebarLayout pageHeaderContent="page-header" mainContainerContent={LOREM} />
    </ShellSideNav>
  );
}
