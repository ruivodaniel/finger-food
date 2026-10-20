/**
 * usePendingInvitationCount — how many invitations await the signed-in
 * caller. What an app shell badges its "My organizations" entry with.
 */

import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../providers/UserOrgMgmtProvider";
import { useSession } from "./use-session";
import { queryKeys } from "../lib/query-keys";

export function usePendingInvitationCount(): number {
  const { client } = useUserOrgMgmtContext();
  const { data: sessionData } = useSession();
  const { data } = useQuery({
    queryKey: queryKeys.myInvitations,
    queryFn: () => client.listMyInvitations(),
    enabled: !!sessionData?.session,
  });
  return data?.length ?? 0;
}
