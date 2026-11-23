/**
 * AllowanceSheet — sets or removes a member's rule, or the rule for every
 * member: the amount per day, week or month, whether what is unspent adds up
 * or resets, what it can be spent on and, for callers allowed to, whether the
 * credits are created rather than coming out of what the organization holds.
 * Spent so far is read from the ledger, never stored.
 */

import * as React from "react";
import { Button, Checkbox, Input, InputSelect, Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ALLOCATION_PERIODS, UNSPENT_MODES, type AllocationPeriod, type AllowanceInput, type UnspentMode } from "../../../shared/types";
import { PERIOD_LABELS, credits, parseCredits } from "../helpers/format";
import type { MemberAllowanceRow } from "../hooks/use-allowances";
import { ServicePicker } from "./ServicePicker";

export interface AllowanceSheetProps {
  organizationName: string;
  /** the row being set; null keeps the sheet closed */
  row: MemberAllowanceRow | null;
  /** the caller's standing lets a rule create credits */
  canCreate: boolean;
  onClose: () => void;
  onSave: (input: AllowanceInput & { userId: string | null }) => Promise<unknown>;
  onClear: (userId: string | null) => Promise<unknown>;
  busy?: boolean;
}

const PERIOD_OPTIONS = ALLOCATION_PERIODS.map((value) => ({ value, label: PERIOD_LABELS[value] }));
const UNSPENT_OPTIONS: { value: UnspentMode; label: string }[] = UNSPENT_MODES.map((value) => ({
  value,
  label: value === "top_up" ? "Add up: unspent credits carry over" : "Reset: each period starts over",
}));

export function AllowanceSheet({ organizationName, row, canCreate, onClose, onSave, onClear, busy }: AllowanceSheetProps): React.ReactElement {
  const [amount, setAmount] = React.useState("");
  const [period, setPeriod] = React.useState<AllocationPeriod>("month");
  const [unspent, setUnspent] = React.useState<UnspentMode>("replace");
  const [services, setServices] = React.useState<string[] | null>(null);
  const [createsCredits, setCreatesCredits] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const current = row?.allowance ?? null;
  const ownRule = current != null && !row?.followsEveryone;
  const key = row?.userId ?? "everyone";

  React.useEffect(() => {
    setAmount(current ? String(current.credits) : "");
    setPeriod(current?.period ?? "month");
    setUnspent(current?.unspent ?? "replace");
    setServices(current?.services ?? null);
    setCreatesCredits(current?.createsCredits ?? false);
    setError(null);
  }, [key, current]);

  const parsed = parseCredits(amount);

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — please try again.");
    }
  };

  return (
    <Sheet open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent data-testid="member-allowance-sheet">
        <SheetHeader><Stack dir="row" align="center" justify="between"><SheetTitle>Allocation · {row?.name ?? ""}</SheetTitle><SheetClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="allowance-sheet-close-btn" /></SheetClose></Stack></SheetHeader>
        {row && (
          <Stack dir="col" scale="lg">
            <span element="type--body-small" emphasis="quiet">
              {row.userId == null
                ? `Applies to every member of ${organizationName} without a rule of their own.`
                : `${row.role ? `${row.role} of ${organizationName}. ` : ""}When this is used up they stop; refunded actions are given back, purchases never count.`}
            </span>
            <Stack dir="row" scale="md">
              <Stack dir="col" scale="2xs" className="flex-1">
                <label element="type--body-small">Credits</label>
                <Input value={amount} inputMode="numeric" placeholder="1,000" onChange={setAmount} data-testid="allowance-cap" />
              </Stack>
              <Stack dir="col" scale="2xs" className="flex-1">
                <label element="type--body-small">Every</label>
                <InputSelect options={PERIOD_OPTIONS} value={period} onChange={(v) => v && setPeriod(v as AllocationPeriod)} data-testid="allowance-period" />
              </Stack>
            </Stack>
            <Stack dir="col" scale="2xs">
              <label element="type--body-small">Unspent credits</label>
              <InputSelect options={UNSPENT_OPTIONS} value={unspent} onChange={(v) => v && setUnspent(v as UnspentMode)} data-testid="allowance-unspent" />
            </Stack>
            <Stack dir="col" scale="2xs">
              <label element="type--body-small">Spend on</label>
              <ServicePicker value={services} onChange={setServices} testId="allowance-services" />
            </Stack>
            {canCreate && (
              <Stack dir="row" scale="sm" align="center">
                <Checkbox checked={createsCredits} onCheckedChange={(on) => setCreatesCredits(on === true)} data-testid="allowance-creates" />
                <span element="type--body-small">Create these credits each period, instead of using what the organization holds</span>
              </Stack>
            )}
            {current && row.userId != null && !row.followsEveryone && (
              <span element="type--body-small" emphasis="quiet" data-testid="allowance-spent">
                Spent: {credits(current.spent)} · left: {credits(current.remaining)}
              </span>
            )}
            {error && (
              <p element="type--body-small" role="alert" data-testid="allowance-error">
                {error}
              </p>
            )}
            <Stack dir="row" scale="sm" justify="between">
              {ownRule ? (
                <Button emphasis="quiet" status="destructive" scale="sm" disabled={busy} onClick={() => void run(() => onClear(row.userId))} data-testid="clear-allowance">
                  Remove the rule
                </Button>
              ) : (
                <span />
              )}
              <Stack dir="row" scale="sm">
                <Button emphasis="secondary" scale="sm" disabled={busy} onClick={onClose} data-testid="cancel-allowance">
                  Cancel
                </Button>
                <Button
                  emphasis="primary"
                  scale="sm"
                  disabled={busy || parsed == null}
                  onClick={() => parsed != null && void run(() => onSave({ userId: row.userId, credits: parsed, period, unspent, services, createsCredits: canCreate && createsCredits }))}
                  data-testid="save-allowance"
                >
                  Save
                </Button>
              </Stack>
            </Stack>
          </Stack>
        )}
      </SheetContent>
    </Sheet>
  );
}
