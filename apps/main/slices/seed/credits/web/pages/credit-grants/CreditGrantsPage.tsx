/**
 * CreditGrantsPage — the platform owner's admin grants: platform credits
 * given without payment, as one lot on an owner's account, spendable
 * on the platform's services. The form names the owner (found by name), the
 * amount, the expiry (none never expires), when it is spent (first as a gift
 * by default, with the plan's credits, or last with top-ups) and why. Below,
 * the grants made so far with what remains of each.
 *
 * The caller acts with the platform organization active; anyone else is told
 * the page is not theirs, and the server refuses them regardless.
 */

import * as React from "react";
import {
  Badge, Button, Card, CardContent, CardFooter, CardHeader, EmptyState, Input, InputSelect,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ListPagination } from "@libs/list-query/client";
import type { OwnerOption } from "../../../shared/types";
import { mounted } from "../../services/application/mount";
import { isForbidden, isUnavailable } from "../../shared/helpers/api-error";
import { credits, formatDate, parseCredits, servicesLabel } from "../../shared/helpers/format";
import { ServicePicker } from "../../shared/components/ServicePicker";
import { useCreditGrants, useGrantCredits, useOwnerSearch } from "../../shared/hooks/use-grants";

const PAGE_SIZE = 20;

const PRIORITIES = [
  { value: "1", label: "first, as a gift" },
  { value: "2", label: "with the plan's credits" },
  { value: "3", label: "last, with top-ups" },
];
const priorityLabel = (p: number) => (p === 1 ? "gift" : p === 2 ? "with the plan" : "with top-ups");
const optionKey = (o: OwnerOption) => (o.owner.organizationId ? `o:${o.owner.organizationId}` : `u:${o.owner.userId}`);

export function CreditGrantsPage(): React.ReactElement | null {
  const { catalog, useActiveOrganization } = mounted();
  const activeOrganization = useActiveOrganization();
  const orgId = activeOrganization?.id ?? null;
  const serviceName = (key: string) => catalog.services.find((s) => s.key === key)?.name ?? key;
  const [page, setPage] = React.useState(1);
  const grants = useCreditGrants(orgId, { page, pageSize: PAGE_SIZE });
  const { grantCredits, busy } = useGrantCredits(orgId);

  const [typed, setTyped] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [chosen, setChosen] = React.useState<OwnerOption | null>(null);
  const [amount, setAmount] = React.useState("");
  const [services, setServices] = React.useState<string[] | null>(null);
  const [expiresOn, setExpiresOn] = React.useState("");
  const [priority, setPriority] = React.useState("1");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const found = useOwnerSearch(orgId, search);

  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(typed.trim()), 300);
    return () => clearTimeout(timer);
  }, [typed]);

  if (!activeOrganization) return null;
  if (isUnavailable(grants.error)) return null;
  if (isForbidden(grants.error)) {
    return (
      <Stack dir="col" scale="sm" className="w-full max-w-3xl" data-testid="credit-grants-forbidden">
        <h2 element="type--heading3">Credit grants</h2>
        <span element="type--body-small" emphasis="quiet">
          Only the platform's owner grants credits, with the platform organization active.
        </span>
      </Stack>
    );
  }

  const parsed = parseCredits(amount);
  const options = found.data ?? [];
  const submit = async () => {
    if (!chosen || parsed == null) return;
    setError(null);
    try {
      await grantCredits({
        owner: chosen.owner,
        amount: parsed,
        services,
        expiresAt: expiresOn ? new Date(`${expiresOn}T23:59:59Z`).toISOString() : null,
        priority: Number(priority),
        note: note.trim() || undefined,
      });
      setChosen(null);
      setTyped("");
      setAmount("");
      setServices(null);
      setExpiresOn("");
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — please try again.");
    }
  };

  return (
    <Stack dir="col" scale="xl" className="w-full max-w-4xl" data-testid="credit-grants-page">
      <Stack dir="col" scale="2xs">
        <h2 element="type--heading3">Credit grants</h2>
        <span element="type--body-small" emphasis="quiet">
          Platform credits given without payment: a lot on the owner's account, spendable on the platform's services, with the expiry and priority you choose.
        </span>
      </Stack>

      <Card className="max-w-xl" data-testid="grant-form">
        <CardHeader>
          <h3 element="type--heading4">New grant</h3>
        </CardHeader>
        <CardContent>
          <Stack dir="col" scale="md">
            <Stack dir="col" scale="2xs">
              <label element="type--body-small">Recipient</label>
              {chosen ? (
                <Stack dir="row" scale="sm" align="center">
                  <span element="type--body" data-testid="grant-owner">
                    {chosen.name}
                  </span>
                  <Badge status="neutral">{chosen.kind}</Badge>
                  <Button emphasis="quiet" scale="sm" onClick={() => setChosen(null)}>
                    Change
                  </Button>
                </Stack>
              ) : (
                <>
                  <Input value={typed} placeholder="Search an organization or a person" onChange={setTyped} data-testid="grant-owner-search" />
                  {search.length >= 2 && (
                    <Stack dir="col" scale="3xs">
                      {options.length === 0 && !found.isPending ? (
                        <span element="type--body-small" emphasis="quiet">
                          Nobody matches "{search}".
                        </span>
                      ) : (
                        options.map((o) => (
                          <Button key={optionKey(o)} emphasis="quiet" scale="sm" onClick={() => setChosen(o)} data-testid={`owner-${optionKey(o)}`}>
                            {o.name} · {o.kind}
                          </Button>
                        ))
                      )}
                    </Stack>
                  )}
                </>
              )}
            </Stack>
            <Stack dir="row" scale="md">
              <Stack dir="col" scale="2xs" className="flex-1">
                <label element="type--body-small">Credits</label>
                <Input value={amount} inputMode="numeric" placeholder="1,000" onChange={setAmount} data-testid="grant-amount" />
              </Stack>
              <Stack dir="col" scale="2xs" className="flex-1">
                <label element="type--body-small">Expires on (empty: never)</label>
                <Input type="date" value={expiresOn} onChange={setExpiresOn} data-testid="grant-expiry" />
              </Stack>
            </Stack>
            <Stack dir="col" scale="2xs">
              <label element="type--body-small">Spend on</label>
              <ServicePicker value={services} onChange={setServices} testId="grant-services" />
            </Stack>
            <Stack dir="col" scale="2xs">
              <label element="type--body-small">Spent</label>
              <InputSelect options={PRIORITIES} value={priority} onChange={(v) => v && setPriority(v as string)} data-testid="grant-priority" />
              <span element="type--body-small" emphasis="quiet">
                Gifts are spent before the plan's credits and top-ups; among equals, the lot expiring soonest goes first.
              </span>
            </Stack>
            <Stack dir="col" scale="2xs">
              <label element="type--body-small">Note</label>
              <Input value={note} placeholder="Why this grant" onChange={setNote} data-testid="grant-note" />
            </Stack>
            {error && (
              <p element="type--body-small" role="alert" data-testid="grant-error">
                {error}
              </p>
            )}
          </Stack>
        </CardContent>
        <CardFooter>
          <Stack dir="row" justify="end" className="w-full">
            <Button
              emphasis="primary"
              scale="sm"
              startIcon="star"
              buttonType="icon-text"
              disabled={busy || !chosen || parsed == null}
              onClick={() => void submit()}
              data-testid="submit-grant"
            >
              Grant
            </Button>
          </Stack>
        </CardFooter>
      </Card>

      <Card data-testid="grants-card">
        <CardHeader>
          <h3 element="type--heading4">Grants so far</h3>
        </CardHeader>
        <CardContent>
          {(grants.data?.rows ?? []).length === 0 ? (
            <EmptyState title="No credits granted yet." data-testid="grants-empty" />
          ) : (
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Can pay for</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grants.data!.rows.map((g) => (
                  <TableRow key={g.id} data-testid={`grant-${g.id}`}>
                    <TableCell>{formatDate(g.createdAt)}</TableCell>
                    <TableCell>{g.ownerName}</TableCell>
                    <TableCell className="text-right">{credits(g.amount)}</TableCell>
                    <TableCell className="text-right">{g.expired ? <Badge status="neutral">expired</Badge> : credits(g.remaining)}</TableCell>
                    <TableCell>{servicesLabel(g.services, serviceName)}</TableCell>
                    <TableCell>{priorityLabel(g.priority)}</TableCell>
                    <TableCell>{g.expiresAt ? formatDate(g.expiresAt) : "never"}</TableCell>
                    <TableCell>
                      <span element="type--body-small" emphasis="quiet">
                        {g.note ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>{g.issuedByName ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {(grants.data?.total ?? 0) > PAGE_SIZE && (
          <CardFooter>
            <ListPagination query={{ page, pageSize: PAGE_SIZE }} total={grants.data?.total ?? 0} onPageChange={setPage} />
          </CardFooter>
        )}
      </Card>
    </Stack>
  );
}
