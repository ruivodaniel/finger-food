/**
 * PageLayout — the page region tree every layout builds, with its two slots:
 * Page › PageHeader + PageBody › [LeftSidebar] + Main › MainContent › MainBody ›
 * Container › children. `header` fills the page header band (none = no band),
 * `sidebar` the section's own left panel (none = no panel). MainBody is the one
 * scrolling column.
 *
 * TitleBandLayout, SettingsLayout and OrgLayout differ only in these two slots.
 */
import type { ReactNode } from "react";
import {
  Page,
  PageHeader,
  PageBody,
  LeftSidebar,
  Main,
  MainContent,
  MainBody,
  Container,
} from "@libs/web-layouts";

export interface PageLayoutProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
}

export function PageLayout({ header, sidebar, children }: PageLayoutProps) {
  return (
    <Page>
      {header && <PageHeader>{header}</PageHeader>}
      <PageBody>
        {sidebar && <LeftSidebar>{sidebar}</LeftSidebar>}
        <Main>
          <MainContent>
            <MainBody>
              <Container>{children}</Container>
            </MainBody>
          </MainContent>
        </Main>
      </PageBody>
    </Page>
  );
}
