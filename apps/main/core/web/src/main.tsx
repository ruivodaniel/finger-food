import { Toaster } from "@libs/web-components";
import "@/config/i18next"; // You must keep this import to initialize i18next
import "@/index.css";
import { initFaro } from "@/config/faro";
import { restoreColorMode } from "@/components/sidebar/color-mode";
import { routeTree } from "@/routes/route-tree";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getActiveOrgId } from "@modules/user-organization-mgmt/web";
import { ACTIVE_ORG_HEADER } from "@modules/user-organization-mgmt/shared";
import { createHttpClient, isApiError } from "@/services/api/http-client";
import { Env } from "@/env";
import { mountNotifications } from "@/config/notifications.config";
import { mountImplementationPatterns } from "@/config/implementation-patterns.config";
import { mountChatbot } from "@/config/chatbot.config";
import { mountCollaboration } from "@/config/collaboration.config";
import { mountCredits } from "@/config/credits.config";
import { mountPayment } from "@/config/payment.config";
import { mountVersioning } from "@/config/versioning.config";
import { mountUserOrgMgmt } from "@/config/uom.config";
import { mountStore } from "@/store";
import { coreRealtime } from "@/config/realtime.config";

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
          isApiError(error) &&
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

// The generic client every slice builds its API on — one origin, one error
// shape, the active org stamped on every request.
const http = createHttpClient({
  baseUrl: Env.VITE_API_URL,
  activeOrgId: getActiveOrgId,
  activeOrgHeader: ACTIVE_ORG_HEADER,
});
mountNotifications({ http, queryClient });
mountVersioning({ http });

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  notFoundMode: "root",
  context: {
    queryClient,
  },
});

mountUserOrgMgmt({ http, queryClient, router });
mountImplementationPatterns({ http, queryClient, router });
mountCollaboration({ http, queryClient, router, realtime: coreRealtime.realtime });
mountChatbot({ http, queryClient, router, realtime: coreRealtime.realtime });
mountCredits({ http, queryClient, router });
mountPayment({ queryClient, router });
mountStore();

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
