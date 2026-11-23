import type { ReactNode } from "react";
import type { OnScrollDirection } from "../../../lib/scroll-direction";
import { Page, PageBody } from "../../../primitives/layouts/page";
import { Main, MainHeader, SecondMainHeader, MainContent, MainBody } from "../../../primitives/layouts/main";
import { PageLeftSidebar } from "../../../primitives/layouts/sidebars";
import { ShellSideNav, ShellNav } from "../../../primitives/layouts/shell";
import { LOREM } from "../_lorem";
/** A layout pattern named by what it is, never by who uses it. Structure only: the regions, and one outlet per region a slice layout fills, named `<region>Content`. The theme owns every look. */
export interface DoubleSidebarMainHeaderLayoutProps {
  /** which regions go away, by name: each one that is true carries the flag `away`. The layout does not know why */
  away?: Partial<Record<"pageLeftSidebar" | "mainHeader" | "secondMainHeader", boolean>>;
  /** told each time the main body's scroll turns: "down" or "up" */
  onScrollDirection?: OnScrollDirection;
  pageLeftSidebarContent: ReactNode;
  mainHeaderContent: ReactNode;
  secondMainHeaderContent: ReactNode;
  mainBodyContent: ReactNode;
}

/** Shell nav (the shell's) + page left sidebar at full height + main with its own header and second header. No page header: the header and the tabs belong to the main. */
export function DoubleSidebarMainHeaderLayout({ away, onScrollDirection, pageLeftSidebarContent, mainHeaderContent, secondMainHeaderContent, mainBodyContent }: DoubleSidebarMainHeaderLayoutProps) {
  return (
    <Page>
      <PageBody>
        <PageLeftSidebar away={away?.pageLeftSidebar}>{pageLeftSidebarContent}</PageLeftSidebar>
        <Main>
          <MainHeader away={away?.mainHeader}>{mainHeaderContent}</MainHeader>
          <SecondMainHeader away={away?.secondMainHeader}>{secondMainHeaderContent}</SecondMainHeader>
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
      <DoubleSidebarMainHeaderLayout pageLeftSidebarContent="page-left-sidebar" mainHeaderContent="main-header" secondMainHeaderContent="second-main-header" mainBodyContent={LOREM} />
    </ShellSideNav>
  );
}
