import { createFileRoute, redirect } from "@tanstack/react-router";
import { FIXTURES } from "../_fixtures/generated";

export const Route = createFileRoute(
  "/sandbox/theme-editor/$themeId/" as never,
)({
  // Hitting `/$themeId` with no fixture redirects to the default fixture so
  // the URL always reflects the current view. Picked once at navigation time;
  // no in-memory fallback below this layer.
  beforeLoad: ({ params }) => {
    const { themeId } = params as { themeId: string };
    const defaultFixture = FIXTURES[0]?.id;
    if (!defaultFixture) return; // No fixtures exist — render index (handled below)
    throw redirect({
      to: "/sandbox/theme-editor/$themeId/$" as never,
      params: { themeId, _splat: defaultFixture } as never,
      replace: true,
    });
  },
  component: NoFixtures,
});

function NoFixtures() {
  return (
    <div className="flex items-center justify-center h-screen text-zinc-400 text-sm p-6">
      No fixtures — add HTML files to{" "}
      <code className="mx-1 font-mono text-xs">_fixtures/html/</code>
      and run{" "}
      <code className="mx-1 font-mono text-xs">pnpm theme:fixtures</code>
    </div>
  );
}
