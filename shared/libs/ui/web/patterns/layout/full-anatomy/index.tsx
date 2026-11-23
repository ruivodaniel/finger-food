import { PageHeader, SecondPageHeader, PageBody, PageFooter, PageLeftSidebar, Main, MainHeader, SecondMainHeader, MainContent, MainBody, MainContainer, MainRightSidebar, MainFooter, PageRightSidebar } from "@libs/web-layouts";
import { LOREM } from "../_lorem";
import { InShell } from "../_frame";

export default function Fixture() {
  return (
    <InShell>
      <PageHeader>page-header</PageHeader>
      <SecondPageHeader>second-page-header</SecondPageHeader>
      <PageBody className="flex flex-1 overflow-hidden">
        <PageLeftSidebar>page-left-sidebar</PageLeftSidebar>
        <Main className="flex flex-1 flex-col overflow-hidden">
          <MainHeader>main-header</MainHeader>
          <SecondMainHeader>second-main-header</SecondMainHeader>
          <MainContent className="flex flex-1 overflow-hidden">
            <MainBody className="flex flex-1 flex-col overflow-y-auto">
              <MainContainer>{LOREM}</MainContainer>
            </MainBody>
            <MainRightSidebar>main-right-sidebar</MainRightSidebar>
          </MainContent>
          <MainFooter>main-footer</MainFooter>
        </Main>
        <PageRightSidebar>page-right-sidebar</PageRightSidebar>
      </PageBody>
      <PageFooter>page-footer</PageFooter>
    </InShell>
  );
}
