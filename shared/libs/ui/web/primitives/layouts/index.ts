/**
 * @libs/web-layouts
 *
 * The layout primitives (the regions, by zone: shell, page, main) and the layout patterns the package ships.
 * Every primitive emits one `layout="..."` attribute — the theme engine owns every look.
 */

// =============================================================================
// Layout patterns — compositions of the primitives, written once to be followed
// =============================================================================

export { AuthPage, type AuthPageProps } from "../../patterns/layout/auth-page/index";
export { DoubleSidebarLayout, type DoubleSidebarLayoutProps } from "../../patterns/layout/double-sidebar-layout/index";
export { SingleSidebarLayout, type SingleSidebarLayoutProps } from "../../patterns/layout/single-sidebar-layout/index";
export { BareLayout, type BareLayoutProps } from "../../patterns/layout/bare-layout/index";
export { SingleSidebarTabsLayout, type SingleSidebarTabsLayoutProps } from "../../patterns/layout/single-sidebar-tabs-layout/index";
export { DoubleSidebarFooterLayout, type DoubleSidebarFooterLayoutProps } from "../../patterns/layout/double-sidebar-footer-layout/index";
export { TripleSidebarTabsLayout, type TripleSidebarTabsLayoutProps } from "../../patterns/layout/triple-sidebar-tabs-layout/index";
export { DoubleSidebarMainHeaderLayout, type DoubleSidebarMainHeaderLayoutProps } from "../../patterns/layout/double-sidebar-main-header-layout/index";
export { DoubleSidebarPageMainHeaderLayout, type DoubleSidebarPageMainHeaderLayoutProps } from "../../patterns/layout/double-sidebar-page-main-header-layout/index";

// =============================================================================
// Primitives
// =============================================================================

export { ShellSideNav, ShellNav, ShellTopNav, ShellNone } from "./shell";
export {
  Page,
  PageHeader, type PageHeaderProps,
  SecondPageHeader, type SecondPageHeaderProps,
  PageBody,
  PageFooter, type PageFooterProps,
} from "./page";
export {
  Main,
  MainHeader, type MainHeaderProps,
  SecondMainHeader, type SecondMainHeaderProps,
  MainContent,
  MainBody,
  MainFooter, type MainFooterProps,
} from "./main";
export {
  PageLeftSidebar, type PageLeftSidebarProps,
  PageRightSidebar, type PageRightSidebarProps,
  MainRightSidebar, type MainRightSidebarProps,
} from "./sidebars";
export {
  MainContainer, type MainContainerProps, type ContainerScale, type ContainerAlign,
} from "./container";
export { ScrollArea } from "./scroll-area";
export { VirtualScrollArea } from "./virtual-scroll-area";
export type { VirtualScrollAreaProps, VirtualPosition, VirtualRange } from "./virtual-scroll-area";
// Stack is a part zone and lives with the components; re-exported here for one round so nothing breaks
export {
  Stack,
  type StackProps, type StackDir, type StackAlign, type StackJustify, type StackSize,
} from "../components/stack";

// deprecated names, kept so earlier explorations compile; they emit the new region
export {
  PageLeftSidebar as LeftSidebar, type PageLeftSidebarProps as LeftSidebarProps,
  PageRightSidebar as RightSidebar, type PageRightSidebarProps as RightSidebarProps,
  MainRightSidebar as ContextPanel, type MainRightSidebarProps as ContextPanelProps,
} from "./sidebars";
export { MainContainer as Container, type MainContainerProps as ContainerProps } from "./container";

export * from "./schemas";
