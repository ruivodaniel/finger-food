/**
 * The allocation hooks — an organization's rules for what its members may
 * spend, joined with the members the app's directory names, and a member's
 * own allocation. What a rule has spent moves with every charge made
 * elsewhere, so the rules are never taken as fresh (the members are).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Allowance, AllowanceInput } from "../../../shared/types";
import { creditsService } from "../../services/application/credits.service";
import { mounted } from "../../services/application/mount";
import { messageOf } from "../helpers/api-error";
import { queryKeys } from "../helpers/query-keys";

/** One row of the allocations table: a member, or (`userId` null) every member without a rule of their own. */
export interface MemberAllowanceRow {
  userId: string | null;
  name: string;
  role: string;
  /** the rule that row has of its own, or that it follows */
  allowance: Allowance | null;
  /** the rule shown is the one for every member */
  followsEveryone: boolean;
}

export function useMembers(organizationId: string | null, options: { enabled?: boolean } = {}) {
  const { listMembers } = mounted();
  return useQuery({
    queryKey: queryKeys.members(organizationId ?? ""),
    queryFn: () => (listMembers as NonNullable<typeof listMembers>)(organizationId as string),
    enabled: organizationId != null && !!listMembers && options.enabled !== false,
  });
}

export function useAllowances(organizationId: string | null, options: { enabled?: boolean } = {}) {
  const { listMembers, toast } = mounted();
  const queryClient = useQueryClient();
  const enabled = organizationId != null && options.enabled !== false;

  const allowances = useQuery({ ...creditsService.allowances(organizationId), staleTime: 0, enabled });
  const members = useMembers(organizationId, { enabled });

  const everyone = allowances.data?.rows.find((a) => a.userId == null) ?? null;
  const rows: MemberAllowanceRow[] = (() => {
    const own = (allowances.data?.rows ?? []).filter((a) => a.userId != null);
    const named = members.data ?? [];
    const byUser = new Map(own.map((a) => [a.userId, a]));
    const row = (userId: string, name: string, role: string): MemberAllowanceRow => {
      const allowance = byUser.get(userId) ?? null;
      return { userId, name, role, allowance: allowance ?? everyone, followsEveryone: allowance == null ? everyone != null : allowance.inherited };
    };
    const out = named.map((m) => row(m.userId, m.name, m.role));
    // a rule whose member has left the organization still shows
    const seen = new Set(named.map((m) => m.userId));
    for (const a of own) if (!seen.has(a.userId as string)) out.push(row(a.userId as string, a.userId as string, ""));
    return [{ userId: null, name: "All members", role: "", allowance: everyone, followsEveryone: false }, ...out];
  })();

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.all });
  const onError = (error: unknown) => toast?.error(messageOf(error));
  const set = useMutation({
    mutationFn: ({ userId, ...input }: AllowanceInput & { userId: string | null }) => creditsService.setAllowance(organizationId as string, userId, input),
    onSuccess: () => void refresh(),
    onError,
  });
  const clear = useMutation({
    mutationFn: (userId: string | null) => creditsService.clearAllowance(organizationId as string, userId),
    onSuccess: () => void refresh(),
    onError,
  });

  return {
    rows,
    canCreate: allowances.data?.canCreate ?? false,
    isReady: !allowances.isPending && (!listMembers || !members.isPending),
    error: allowances.error,
    setAllowance: (input: AllowanceInput & { userId: string | null }) => set.mutateAsync(input),
    clearAllowance: (userId: string | null) => clear.mutateAsync(userId),
    busy: set.isPending || clear.isPending,
  };
}

/** The caller's own allocation in the organization, or null when no rule applies. */
export function useMyAllowance(organizationId: string | null) {
  return useQuery({ ...creditsService.myAllowance(organizationId), staleTime: 0 });
}
