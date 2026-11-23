import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sandbox/theme-editor" as never)({
  beforeLoad: () => {
    if (import.meta.env.PROD) throw redirect({ to: "/" as never });
  },
  component: () => <Outlet />,
});
