/**
 * Credits, as the screens ask for them. Reads are query options: a 401/428 is
 * a state (nothing to show) and a 403 is a state too (the caller does not
 * manage these credits), neither is retried. Writes refresh what they changed.
 * A target is a scope plus, for an organization, its id.
 */

import { queryOptions } from "@tanstack/react-query";
import type { AllowanceInput, CreditOwner, CreditScope } from "../../../shared/types";
import { notAState } from "../../shared/helpers/api-error";
import { queryKeys } from "../../shared/helpers/query-keys";
import { creditsApi, type PageQuery } from "../api/credits.api";

export type { PageQuery } from "../api/credits.api";

export interface CreditsTarget {
  scope: CreditScope;
  /** the organization, for `scope: "organization"`; null while unresolved */
  organizationId: string | null;
}

const orgOf = (t: CreditsTarget) => t.organizationId ?? undefined;
const ready = (t: CreditsTarget) => t.scope === "account" || t.organizationId != null;

export const creditsService = {
  summary: (target: CreditsTarget) =>
    queryOptions({
      queryKey: queryKeys.summary(target.scope, target.organizationId),
      queryFn: () => creditsApi.summary(target.scope, orgOf(target)),
      enabled: ready(target),
      retry: notAState,
    }),
  lots: (target: CreditsTarget, page: PageQuery) =>
    queryOptions({
      queryKey: queryKeys.lots(target.scope, target.organizationId, page.page),
      queryFn: () => creditsApi.lots(target.scope, page, orgOf(target)),
      enabled: ready(target),
      retry: notAState,
      placeholderData: (previous) => previous,
    }),
  ledger: (target: CreditsTarget, page: PageQuery) =>
    queryOptions({
      queryKey: queryKeys.ledger(target.scope, target.organizationId, page.page),
      queryFn: () => creditsApi.ledger(target.scope, page, orgOf(target)),
      enabled: ready(target),
      retry: notAState,
      placeholderData: (previous) => previous,
    }),

  allowances: (organizationId: string | null) =>
    queryOptions({
      queryKey: queryKeys.allowances(organizationId ?? ""),
      queryFn: () => creditsApi.allowances(organizationId as string),
      enabled: organizationId != null,
      retry: notAState,
    }),
  myAllowance: (organizationId: string | null) =>
    queryOptions({
      queryKey: queryKeys.myAllowance(organizationId ?? ""),
      queryFn: () => creditsApi.myAllowance(organizationId as string),
      enabled: organizationId != null,
      retry: notAState,
    }),
  setAllowance: (organizationId: string, userId: string | null, input: AllowanceInput) => creditsApi.setAllowance(organizationId, userId, input),
  clearAllowance: (organizationId: string, userId: string | null) => creditsApi.clearAllowance(organizationId, userId),

  creditGrants: (organizationId: string | null, page: PageQuery) =>
    queryOptions({
      queryKey: queryKeys.creditGrants(organizationId ?? "", page.page),
      queryFn: () => creditsApi.creditGrants(organizationId as string, page),
      enabled: organizationId != null,
      retry: notAState,
      placeholderData: (previous) => previous,
    }),
  /** Owners whose name matches; nothing is asked for under two characters. */
  ownerSearch: (organizationId: string | null, search: string) =>
    queryOptions({
      queryKey: queryKeys.ownerSearch(organizationId ?? "", search),
      queryFn: () => creditsApi.searchOwners(organizationId as string, search),
      enabled: organizationId != null && search.length >= 2,
      retry: notAState,
    }),
  grantCredits: (organizationId: string, input: { owner: CreditOwner; amount: number; services: string[] | null; expiresAt: string | null; priority: number; note?: string }) =>
    creditsApi.grantCredits(organizationId, input),
};
