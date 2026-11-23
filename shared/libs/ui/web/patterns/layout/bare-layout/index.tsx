import type { ReactNode } from "react";
import type { OnScrollDirection } from "../../../lib/scroll-direction";
import { Page, PageBody } from "../../../primitives/layouts/page";
import { Main, MainContent, MainBody } from "../../../primitives/layouts/main";
import { MainContainer, type ContainerScale } from "../../../primitives/layouts/container";
import { ShellSideNav, ShellNav } from "../../../primitives/layouts/shell";
import { LOREM } from "../_lorem";
/** A layout pattern named by what it is, never by who uses it. Structure only: the regions, and one outlet per region a slice layout fills, named `<region>Content`. The theme owns every look. */
export interface BareLayoutProps {
  /** told each time the main body's scroll turns: "down" or "up" */
  onScrollDirection?: OnScrollDirection;
  /** the main container's measure; the theme gives each scale its width */
  scale?: ContainerScale;
  mainContainerContent: ReactNode;
}

/** Main only: no page header, no sidebar. The layout of a document read on its own. */
export function BareLayout({ onScrollDirection, scale, mainContainerContent }: BareLayoutProps) {
  return (
    <Page>
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
      <BareLayout mainContainerContent={LOREM} />
    </ShellSideNav>
  );
}
