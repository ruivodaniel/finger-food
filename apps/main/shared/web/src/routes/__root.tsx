import { NotFound } from "@/components/NotFound";
import { NotificationsProvider } from "@modules/notifications/web";
import { UserOrgMgmtProvider } from "@modules/user-organization-mgmt/web";
import { notificationsWebConfig } from "@/config/notifications.config";
import { uomWebConfig } from "@/config/uom.config";
import { Brand } from "@configs/brand";
import { OrganizationAvatar } from "@/components/OrganizationAvatar";
import { UserAvatar } from "@/components/UserAvatar";
import { EmptyState } from "@/components/EmptyState";
import { StatusAlert } from "@/components/StatusAlert";
import { ConfirmModal } from "@/components/ConfirmModal";
import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "@libs/web-components";

export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: Brand.appName }],
  }),
  notFoundComponent: NotFound,
  component: RootComponent,
});

function RootComponent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return (
    <>
      <HeadContent />
      <UserOrgMgmtProvider
        config={uomWebConfig}
        queryClient={queryClient}
        router={{
          navigate: async (opts) => {
            await router.navigate(opts as never);
          },
          currentPath: () => {
            const loc = router.state.location;
            return loc.pathname + (loc.searchStr ?? "");
          },
        }}
        toast={{
          success: (msg) => toast.success(msg),
          error: (msg) => toast.error(msg),
        }}
        components={{ UserAvatar, OrganizationAvatar, EmptyState, StatusAlert, ConfirmModal }}>
        <NotificationsProvider
          config={notificationsWebConfig}
          queryClient={queryClient}
          components={{ EmptyState }}
          toast={{
            success: (msg) => toast.success(msg),
            error: (msg) => toast.error(msg),
          }}>
          <Outlet />
        </NotificationsProvider>
      </UserOrgMgmtProvider>
    </>
  );
}
