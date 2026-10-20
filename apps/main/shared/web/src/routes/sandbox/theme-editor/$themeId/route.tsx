import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/sandbox/theme-editor/$themeId" as never,
)({
  component: ThemeIdLayout,
});

/**
 * Layout for the `/sandbox/theme-editor/$themeId/...` subtree.
 *
 * This layout exists purely so we can hang two children off `$themeId`:
 *   - `index.tsx`     → redirect to the default fixture
 *   - `$fixtureId.tsx`→ the actual editor page
 *
 * Identifiers in path follow the standard pattern (theme owns fixture).
 */
function ThemeIdLayout() {
  return <Outlet />;
}
