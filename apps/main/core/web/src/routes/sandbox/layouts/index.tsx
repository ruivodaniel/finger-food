import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sandbox/layouts/" as never)({
  component: LayoutsMenu,
});

const ITEMS = [
  {
    to: "/sandbox/layouts/regions" as const,
    title: "Regions playground",
    description: "Toggle shell / page-header / sidebars / etc. to see how layout regions compose.",
  },
  {
    to: "/sandbox/layouts/map" as const,
    title: "Layout map",
    description: "Gallery of cached page snapshots — drives the page → standard-layout mapping.",
  },
  {
    to: "/sandbox/layouts/snapshots" as const,
    title: "Snapshots",
    description: "Capture rendered HTML of registered pages via Playwright. Powers the map and theme-editor previews.",
  },
];

function LayoutsMenu() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-12 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <Link to={"/sandbox" as never} className="text-[11px] uppercase tracking-wider text-zinc-500 hover:text-zinc-700">
          ← Sandbox
        </Link>
        <h1 className="text-2xl font-semibold">Layouts</h1>
      </header>

      <div className="grid gap-3 max-w-2xl">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to as never}
            className="block bg-white rounded-lg border border-zinc-200 px-4 py-3 hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
          >
            <div className="text-sm font-semibold text-zinc-900">
              {item.title}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              {item.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
