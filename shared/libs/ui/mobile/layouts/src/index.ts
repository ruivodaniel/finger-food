/**
 * @libs/mobile-layouts
 *
 * Structural layout primitives for mobile screens: the mobile twin of @libs/web-layouts.
 * The regions read their surface and their dimensions from the mobile theme (layouts.<region>).
 */
export { Stack, type StackProps, type StackDir, type StackAlign, type StackJustify, type StackSize } from "./components/Stack";
export { Screen, ScreenOverlay, AppBar, Body, ActionBar, type AppBarProps, type BodyProps } from "./components/Screen";
export { TabBar, type TabBarProps, type TabBarItem } from "./components/TabBar";
export { Drawer, type DrawerProps } from "./components/Drawer";
export * from "./schemas";
