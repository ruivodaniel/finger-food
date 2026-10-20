import * as React from "react";
import { useUserOrgMgmtContext } from "../providers/UserOrgMgmtProvider";
import { DefaultOrganizationAvatar, DefaultUserAvatar } from "../components/DefaultAvatars";
import { DefaultEmptyState } from "../components/DefaultEmptyState";
import { DefaultStatusAlert } from "../components/DefaultStatusAlert";
import { DefaultConfirmModal } from "../components/DefaultConfirmModal";
import type { UserOrgMgmtComponents } from "../types";

/** The shared components the app injected, over the module's own defaults. */
export function useComponents(): UserOrgMgmtComponents {
  const { components } = useUserOrgMgmtContext();
  return React.useMemo(
    () => ({
      UserAvatar: components?.UserAvatar ?? DefaultUserAvatar,
      OrganizationAvatar: components?.OrganizationAvatar ?? DefaultOrganizationAvatar,
      EmptyState: components?.EmptyState ?? DefaultEmptyState,
      StatusAlert: components?.StatusAlert ?? DefaultStatusAlert,
      ConfirmModal: components?.ConfirmModal ?? DefaultConfirmModal,
    }),
    [components],
  );
}
