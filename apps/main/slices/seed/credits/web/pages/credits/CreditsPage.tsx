/**
 * CreditsPage — one page, two scopes, for every member: `account` is the
 * person's own (inside Settings), `organization` the organization's, for
 * whoever manages its credits, with the members' allocations. The URL names
 * the organization (`current` aliases the active one). A member who lands on
 * an organization's page without the role sees their own allocation and
 * nothing else. Buying credits is another slice's (payment's Billing): the app
 * says where, and the page shows "Buy credits" when it does.
 */

import * as React from "react";
import { Button } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { CreditScope } from "../../../shared/types";
import { mounted } from "../../services/application/mount";
import { CreditsBalance, CreditsLedger, CreditsLots, MemberLimits, OwnLimit } from "../../shared/components/CreditsSections";
import { isForbidden, isUnavailable } from "../../shared/helpers/api-error";
import { useCreditsSummary, type CreditsTarget } from "../../shared/hooks/use-credits";

export interface CreditsPageProps {
  scope: CreditScope;
  /** an organization id or the literal `current`; organization scope only */
  organizationId?: string;
}

const nowhereToBuy = (): null => null;

export function CreditsPage({ scope, organizationId = "current" }: CreditsPageProps): React.ReactElement | null {
  const { useActiveOrganization, useBuyCredits = nowhereToBuy } = mounted();
  const active = useActiveOrganization();
  const organization =
    scope === "organization"
      ? organizationId === "current"
        ? active
        : { id: organizationId, name: active?.id === organizationId ? active.name : "this organization" }
      : null;
  const target: CreditsTarget = { scope, organizationId: organization?.id ?? null };
  const summary = useCreditsSummary(target);
  const buyCredits = useBuyCredits(target);

  if (scope === "organization" && !organization) {
    return (
      <Stack dir="col" scale="sm" className="w-full max-w-3xl" data-testid="credits-no-active-org">
        <h2 element="type--heading3">No active organization</h2>
        <span element="type--body-small" emphasis="quiet">
          You're not acting in any organization — pick one from the switcher, or create or join one from Organizations.
        </span>
      </Stack>
    );
  }
  if (isUnavailable(summary.error)) return null;
  if (isForbidden(summary.error)) return <OwnLimit organizationId={organization?.id ?? null} organizationName={organization?.name ?? null} />;
  if (summary.isPending) return null;

  return (
    <Stack dir="col" scale="xl" className="w-full max-w-4xl" data-testid={scope === "account" ? "personal-credits-page" : "organization-credits-page"}>
      <Stack dir="col" scale="sm">
        <CreditsBalance target={target} />
        {buyCredits && (
          <Stack dir="row">
            <Button emphasis="secondary" scale="sm" onClick={buyCredits} data-testid="buy-credits">
              Buy credits
            </Button>
          </Stack>
        )}
      </Stack>
      <CreditsLots target={target} />
      {scope === "account" && <OwnLimit organizationId={active?.id ?? null} organizationName={active?.name ?? null} />}
      {scope === "organization" && organization && <MemberLimits organizationId={organization.id} organizationName={organization.name} />}
      <CreditsLedger target={target} />
    </Stack>
  );
}
