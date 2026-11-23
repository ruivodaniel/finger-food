/**
 * The credits screens as sections that fetch their own data: this slice's
 * credits page lays them out, and another slice's page (billing) can place
 * them among its own through this slice's public surface, with only a target
 * in hand.
 */

import * as React from "react";
import { mounted } from "../../services/application/mount";
import { useAllowances, useMembers, useMyAllowance, type MemberAllowanceRow } from "../hooks/use-allowances";
import { useCreditsSummary, useLedger, useLots, type CreditsTarget } from "../hooks/use-credits";
import { AllowanceSheet } from "./AllowanceSheet";
import { AllowancesTable } from "./AllowancesTable";
import { BalanceCard } from "./BalanceCard";
import { LedgerTable } from "./LedgerTable";
import { LotsTable } from "./LotsTable";
import { MyAllowanceCard } from "./MyAllowanceCard";

const PAGE_SIZE = 20;

function useServiceName(): (key: string) => string {
  const { catalog } = mounted();
  return (key) => catalog.services.find((s) => s.key === key)?.name ?? key;
}

export interface CreditsSectionProps {
  target: CreditsTarget;
  /** look again for a short while: credits bought at Checkout land when the webhook does */
  poll?: boolean;
}

export function CreditsBalance({ target, poll }: CreditsSectionProps): React.ReactElement | null {
  const summary = useCreditsSummary(target, { poll });
  const serviceName = useServiceName();
  return summary.data ? <BalanceCard summary={summary.data} serviceName={serviceName} /> : null;
}

export function CreditsLots({ target, poll }: CreditsSectionProps): React.ReactElement | null {
  const summary = useCreditsSummary(target, { poll });
  const [page, setPage] = React.useState(1);
  const lots = useLots(target, { page, pageSize: PAGE_SIZE }, { poll });
  const serviceName = useServiceName();
  if (!summary.data) return null;
  const vendorName = (id: string) => summary.data.vendorBalances.find((v) => v.vendorOrganizationId === id)?.vendorName ?? id;
  return <LotsTable rows={lots.data?.rows ?? []} total={lots.data?.total ?? 0} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} vendorName={vendorName} serviceName={serviceName} />;
}

export function CreditsLedger({ target, poll }: CreditsSectionProps): React.ReactElement | null {
  const summary = useCreditsSummary(target, { poll });
  const [page, setPage] = React.useState(1);
  const ledger = useLedger(target, { page, pageSize: PAGE_SIZE }, { poll });
  const members = useMembers(target.scope === "organization" ? target.organizationId : null);
  const serviceName = useServiceName();
  if (!summary.data) return null;
  const memberName = (userId: string) => members.data?.find((m) => m.userId === userId)?.name ?? userId;
  return (
    <LedgerTable
      rows={ledger.data?.rows ?? []}
      total={ledger.data?.total ?? 0}
      page={page}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
      serviceName={serviceName}
      memberName={target.scope === "organization" ? memberName : undefined}
    />
  );
}

/** The organization's members and their allocations, for whoever manages its credits. */
export function MemberLimits({ organizationId, organizationName }: { organizationId: string; organizationName: string }): React.ReactElement | null {
  const allowances = useAllowances(organizationId);
  const [editing, setEditing] = React.useState<MemberAllowanceRow | null>(null);
  const serviceName = useServiceName();
  if (!allowances.isReady) return null;
  return (
    <>
      <AllowancesTable rows={allowances.rows} onEdit={setEditing} serviceName={serviceName} />
      <AllowanceSheet
        organizationName={organizationName}
        row={editing}
        canCreate={allowances.canCreate}
        onClose={() => setEditing(null)}
        onSave={allowances.setAllowance}
        onClear={allowances.clearAllowance}
        busy={allowances.busy}
      />
    </>
  );
}

/** The caller's own allocation in an organization. */
export function OwnLimit({ organizationId, organizationName }: { organizationId: string | null; organizationName: string | null }): React.ReactElement {
  const mine = useMyAllowance(organizationId);
  const serviceName = useServiceName();
  return <MyAllowanceCard organizationName={organizationName} allowance={mine.data} serviceName={serviceName} />;
}
