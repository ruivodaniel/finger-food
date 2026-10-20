import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/sandbox/layouts" as never)({
  component: () => <Outlet />,
});
