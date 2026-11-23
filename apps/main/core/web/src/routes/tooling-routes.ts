/**
 * Tooling — the sandbox and the theme editor: pages of the people who build the product, not of the product. Mounted under the
 * root, apart from every shell, and never in production (their own routes redirect). Not the core's pages: the core has none.
 */
import type { AnyRoute } from "@tanstack/react-router";
import { Route as SandboxRoute } from "./sandbox/route";
import { Route as SandboxIndexRoute } from "./sandbox/index";
import { Route as SandboxLayoutsRoute } from "./sandbox/layouts/route";
import { Route as SandboxLayoutsIndexRoute } from "./sandbox/layouts/index";
import { Route as SandboxLayoutsRegionsRoute } from "./sandbox/layouts/regions/index";
import { Route as SandboxLayoutsMapRoute } from "./sandbox/layouts/map/index";
import { Route as SandboxLayoutsSnapshotsRoute } from "./sandbox/layouts/snapshots/index";
import { Route as ThemeEditorRoute } from "./sandbox/theme-editor/route";
import { Route as ThemeEditorIndexRoute } from "./sandbox/theme-editor/index";
import { Route as ThemeEditorThemeIdLayoutRoute } from "./sandbox/theme-editor/$themeId/route";
import { Route as ThemeEditorThemeIdIndexRoute } from "./sandbox/theme-editor/$themeId/index";
import { Route as ThemeEditorFixtureSplatRoute } from "./sandbox/theme-editor/$themeId/$";

/** The tooling routes, wired under `rootRoute`. File routes need explicit id/path/parent wiring in code-based assembly. */
export function toolingRoutes(rootRoute: AnyRoute): AnyRoute {
  SandboxRoute.update({ id: "/sandbox", path: "/sandbox", getParentRoute: () => rootRoute } as never);
  SandboxIndexRoute.update({ id: "/", path: "/", getParentRoute: () => SandboxRoute } as never);
  SandboxLayoutsRoute.update({ id: "/layouts", path: "/layouts", getParentRoute: () => SandboxRoute } as never);
  SandboxLayoutsIndexRoute.update({ id: "/", path: "/", getParentRoute: () => SandboxLayoutsRoute } as never);
  SandboxLayoutsRegionsRoute.update({ id: "/regions", path: "/regions", getParentRoute: () => SandboxLayoutsRoute } as never);
  SandboxLayoutsMapRoute.update({ id: "/map", path: "/map", getParentRoute: () => SandboxLayoutsRoute } as never);
  SandboxLayoutsSnapshotsRoute.update({ id: "/snapshots", path: "/snapshots", getParentRoute: () => SandboxLayoutsRoute } as never);

  ThemeEditorRoute.update({ id: "/theme-editor", path: "/theme-editor", getParentRoute: () => SandboxRoute } as never);
  ThemeEditorIndexRoute.update({ id: "/", path: "/", getParentRoute: () => ThemeEditorRoute } as never);
  ThemeEditorThemeIdLayoutRoute.update({ id: "/$themeId", path: "/$themeId", getParentRoute: () => ThemeEditorRoute } as never);
  ThemeEditorThemeIdIndexRoute.update({ id: "/", path: "/", getParentRoute: () => ThemeEditorThemeIdLayoutRoute } as never);
  ThemeEditorFixtureSplatRoute.update({ id: "/$", path: "/$", getParentRoute: () => ThemeEditorThemeIdLayoutRoute } as never);

  const themeEditorThemeIdWithChildren = ThemeEditorThemeIdLayoutRoute._addFileChildren([ThemeEditorThemeIdIndexRoute, ThemeEditorFixtureSplatRoute]);
  const themeEditorWithChildren = ThemeEditorRoute._addFileChildren([ThemeEditorIndexRoute, themeEditorThemeIdWithChildren]);
  const sandboxLayoutsWithChildren = SandboxLayoutsRoute._addFileChildren([
    SandboxLayoutsIndexRoute,
    SandboxLayoutsRegionsRoute,
    SandboxLayoutsMapRoute,
    SandboxLayoutsSnapshotsRoute,
  ]);
  return SandboxRoute._addFileChildren([SandboxIndexRoute, sandboxLayoutsWithChildren, themeEditorWithChildren]) as never;
}
