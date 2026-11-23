/**
 * The credit grants hooks — the platform owner's admin grants: the grants
 * made so far, credit owners found by name, and the grant itself. Every call
 * names the platform organization in the request header; a 403 is a state
 * (the caller is not the platform's owner), never retried.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreditOwner } from "../../../shared/types";
import { creditsService, type PageQuery } from "../../services/application/credits.service";
import { mounted } from "../../services/application/mount";
import { queryKeys } from "../helpers/query-keys";

export function useCreditGrants(organizationId: string | null, page: PageQuery) {
  return useQuery(creditsService.creditGrants(organizationId, page));
}

export function useOwnerSearch(organizationId: string | null, search: string) {
  return useQuery(creditsService.ownerSearch(organizationId, search));
}

export function useGrantCredits(organizationId: string | null) {
  const { toast } = mounted();
  const queryClient = useQueryClient();
  const grant = useMutation({
    mutationFn: (input: { owner: CreditOwner; amount: number; services: string[] | null; expiresAt: string | null; priority: number; note?: string }) =>
      creditsService.grantCredits(organizationId as string, input),
    onSuccess: () => {
      toast?.success("Credits granted.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
  return { grantCredits: grant.mutateAsync, busy: grant.isPending };
}
