import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ShellSideNav, ShellNav, ShellTopNav, ShellNone,
  Page, PageHeader, PageBody,
  Main, MainHeader, MainFooter, MainContent, MainBody,
  LeftSidebar, RightSidebar, ContextPanel,
  Container,
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
        {show["left-sidebar"] && <LeftSidebar collapsed={collapsed}>{f("left-sidebar")}</LeftSidebar>}
        <Main>
          {show["main-header"] && <MainHeader>{f("main-header")}</MainHeader>}
          <MainContent>
            <MainBody>
              <Container>{f("container")}</Container>
            </MainBody>
            {show["context-panel"] && (
              <ContextPanel>{f("context-panel")}</ContextPanel>
            )}
          </MainContent>
          {show["main-footer"] && <MainFooter>{f("main-footer")}</MainFooter>}
        </Main>
        {show["right-sidebar"] && <RightSidebar>{f("right-sidebar")}</RightSidebar>}
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
    "left-sidebar":  true,
    "main-header":   true,
    "main-footer":   true,
    "context-panel": true,
    "right-sidebar": true,
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
