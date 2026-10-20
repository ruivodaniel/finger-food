import { Toaster } from "@libs/web-components";
import "@/i18n/i18next"; // You must keep this import to initialize i18next
import "@/index.css";
import { initFaro } from "@/lib/observability/faro";
import { restoreColorMode } from "@/lib/color-mode";
import { routeTree } from "@/route-tree";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApiError } from "@modules/user-organization-mgmt/web";

// Export queryClient for use in route loaders with ensureQueryData
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute - data considered fresh, no refetch on mount
      gcTime: 1000 * 60 * 5, // 5 minutes - keep in cache
      // A 4xx is the server's answer, not a hiccup — retrying can't change it
      // (a 428 is the gate, and the uom client is already routing to
      // /resolve). Only 408 / 429 can succeed later. Network failures and
      // 5xx still retry.
      retry: (failureCount, error) =>
        !(
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 408 &&
          error.status !== 429
        ) && failureCount < 3,
    },
  },
});

initFaro();
restoreColorMode();

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  notFoundMode: "root",
  context: {
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    // Route type registry is empty — using code-based routing without file-based plugin.
    // Type safety for navigation paths is handled via `as never` casts at usage sites.
    router: typeof router;
  }
}

export type RouterContext = {
  queryClient: QueryClient;
};

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
      <Toaster richColors={true} expand={true} position="top-right" theme="light" />
    </StrictMode>,
  );
}
