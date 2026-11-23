import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sandbox/" as never)({
  component: SandboxMenu,
});

const ITEMS = [
  {
    to: "/sandbox/theme-editor" as const,
    title: "Theme Editor",
    description: "Edit themes — primitives, families, elements, layouts, and rules — against live fixtures.",
  },
  {
    to: "/sandbox/layouts" as const,
    title: "Layouts",
    description: "Layout region playground and page → standard-layout mapping for the product.",
  },
];

/**
 * Sandbox top-level menu.
 *
 * THEME ISOLATION RULE: this is sandbox chrome — must use static palette
 * colors only (no themed Tailwind tokens) so it stays stable when the
 * theme being edited changes.
 */
function SandboxMenu() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-12 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">
          Sandbox
        </span>
        <h1 className="text-2xl font-semibold">Internal tools</h1>
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
