import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ShellSideNav, ShellNav, ShellTopNav, ShellNone,
  Page, PageHeader, PageBody,
  Main, MainHeader, MainFooter, MainContent, MainBody,
  PageLeftSidebar, PageRightSidebar, MainRightSidebar,
  MainContainer,
} from "@libs/web-layouts";
import { SandboxSwatch as Filler } from "./_parts/SandboxSwatch";
import { SandboxControls as Controls, type ShellVariant } from "./_parts/SandboxControls";
import { SandboxSidebar } from "./_parts/SandboxSidebar";

export const Route = createFileRoute("/sandbox/layouts/regions/" as never)({
  component: RegionsPlayground,
});

// =============================================================================
// Page content — shell-agnostic
// =============================================================================

function PageContent({ show, collapsed, showColors, showText }: { show: Record<string, boolean>; collapsed: boolean; showColors: boolean; showText: boolean }) {
  const f = (region: string) => <Filler region={region} showColors={showColors} showText={showText} />;
  return (
    <Page>
      {show["page-header"] && <PageHeader>{f("page-header")}</PageHeader>}
      <PageBody>
        {show["page-left-sidebar"] && <PageLeftSidebar collapsed={collapsed}>{f("page-left-sidebar")}</PageLeftSidebar>}
        <Main>
          {show["main-header"] && <MainHeader>{f("main-header")}</MainHeader>}
          <MainContent>
            <MainBody>
              <MainContainer>{f("main-container")}</MainContainer>
            </MainBody>
            {show["main-right-sidebar"] && (
              <MainRightSidebar>{f("main-right-sidebar")}</MainRightSidebar>
            )}
          </MainContent>
          {show["main-footer"] && <MainFooter>{f("main-footer")}</MainFooter>}
        </Main>
        {show["page-right-sidebar"] && <PageRightSidebar>{f("page-right-sidebar")}</PageRightSidebar>}
      </PageBody>
    </Page>
  );
}

// =============================================================================
// Root
// =============================================================================

function RegionsPlayground() {
  const [shell, setShell] = React.useState<ShellVariant>("side-nav");
  const [show, setShow] = React.useState<Record<string, boolean>>({
    "page-header":   true,
    "page-left-sidebar":  true,
    "main-header":   true,
    "main-footer":   true,
    "main-right-sidebar": true,
    "page-right-sidebar": true,
  });

  const [collapsed, setCollapsed] = React.useState(false);
  const [showColors, setShowColors] = React.useState(true);
  const [showText, setShowText] = React.useState(true);
  const toggle = (key: string) => setShow(s => ({ ...s, [key]: !s[key] }));
  const pc = { show, collapsed, showColors, showText };
  const f = (region: string) => <Filler region={region} showColors={showColors} showText={showText} />;

  return (
    <>
      {shell === "side-nav" && (
        <ShellSideNav>
          <ShellNav><SandboxSidebar /></ShellNav>
          <PageContent {...pc} />
        </ShellSideNav>
      )}

      {shell === "top-nav" && (
        <ShellTopNav>
          {f("shell-top-nav")}
          <PageContent {...pc} />
        </ShellTopNav>
      )}

      {shell === "none" && (
        <ShellNone>
          <PageContent {...pc} />
        </ShellNone>
      )}

      <Controls
        shell={shell} onShell={setShell}
        show={show} onToggle={toggle}
        collapsed={collapsed} onToggleCollapsed={() => setCollapsed(v => !v)}
        showColors={showColors} onToggleColors={() => setShowColors(v => !v)}
        showText={showText} onToggleText={() => setShowText(v => !v)}
      />
    </>
  );
}
