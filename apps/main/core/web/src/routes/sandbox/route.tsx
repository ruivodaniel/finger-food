import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sandbox" as never)({
  beforeLoad: () => {
    if (import.meta.env.PROD) throw redirect({ to: "/" as never });
  },
  component: () => <Outlet />,
});
