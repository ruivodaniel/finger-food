/**
 * VendorCreditsSheet — where a vendor issues its own credits, in one of two
 * modes:
 *
 *   settle a sale  in credits instead of money, within the product's refund
 *                  policy and never above what is still unsettled; the lot
 *                  expires after the catalog's default. When the policy also
 *                  allows money, the way to the Stripe dashboard sits beside it.
 *   promotion      credits with no purchase behind them, to one of the
 *                  vendor's buyers, with the expiry the vendor chooses.
 *
 * Amounts are typed in the currency and sent in cents.
 */

import * as React from "react";
import { Button, Input, InputSelect, Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { PaymentOwner, PurchaseView, RefundPolicy } from "../../shared/types";
import { formatDate, money, parseMoney } from "../lib/format";

export type VendorCreditsMode = { kind: "refund"; sale: PurchaseView; refundPolicy: RefundPolicy } | { kind: "promotion" } | null;

export interface VendorCreditsSheetProps {
  mode: VendorCreditsMode;
  currency: string;
  /** the catalog's expiry of a credit refund, in days; null never expires */
  refundExpiresInDays: number | null;
  /** who a promotion can go to: the vendor's buyers */
  buyers: { owner: PaymentOwner; name: string }[];
  onClose: () => void;
  onCreditRefund: (purchaseId: string, amount: number) => Promise<unknown>;
  onPromote: (input: { owner: PaymentOwner; amount: number; expiresAt: string }) => Promise<unknown>;
  onMoneyRefund: () => void;
  busy?: boolean;
}

const ownerKey = (owner: PaymentOwner) => (owner.organizationId ? `o:${owner.organizationId}` : `u:${owner.userId}`);

/** What of a sale is still unsettled, in cents. */
export const unsettledOf = (sale: Pick<PurchaseView, "amountTotal" | "refundedAmount" | "creditsRefunded">) => Math.max(0, sale.amountTotal - sale.refundedAmount - sale.creditsRefunded);

/** Whether a sale may be settled in the vendor's credits: paid with them, or a policy that allows credits. */
export const creditsAllowed = (sale: Pick<PurchaseView, "paidWith">, policy: RefundPolicy) => sale.paidWith === "vendor_credits" || policy !== "money";

export function VendorCreditsSheet(props: VendorCreditsSheetProps): React.ReactElement {
  const { mode, currency, refundExpiresInDays, buyers, onClose, busy } = props;
  const [amount, setAmount] = React.useState("");
  const [ownerChoice, setOwnerChoice] = React.useState("");
  const [expiresOn, setExpiresOn] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setError(null);
    setOwnerChoice(buyers[0] ? ownerKey(buyers[0].owner) : "");
    setExpiresOn("");
    setAmount(mode?.kind === "refund" ? (unsettledOf(mode.sale) / 100).toFixed(2) : "");
  }, [mode, buyers]);

  const cents = parseMoney(amount);
  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — please try again.");
    }
  };

  const refundExpiry = refundExpiresInDays == null ? "never" : formatDate(new Date(Date.now() + refundExpiresInDays * 86_400_000).toISOString());

  return (
    <Sheet open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent data-testid="vendor-credits-sheet">
        {mode?.kind === "refund" && (
          <>
            <SheetHeader><Stack dir="row" align="center" justify="between"><SheetTitle>Settle a sale</SheetTitle><SheetClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="vendor-credits-sheet-close-btn" /></SheetClose></Stack></SheetHeader>
            <SettleSale {...props} sale={mode.sale} policy={mode.refundPolicy} amount={amount} setAmount={setAmount} cents={cents} expiry={refundExpiry} run={run} error={error} />
          </>
        )}
        {mode?.kind === "promotion" && (
          <>
            <SheetHeader><Stack dir="row" align="center" justify="between"><SheetTitle>Give a promotion</SheetTitle><SheetClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="vendor-credits-sheet-2-close-btn" /></SheetClose></Stack></SheetHeader>
            <Stack dir="col" scale="md" data-testid="promotion">
              <span element="type--body-small" emphasis="quiet">
                Credits with no purchase behind them, spendable on your products only, with an expiry you set.
              </span>
              {buyers.length === 0 ? (
                <span element="type--body-small">Promotions go to your buyers; you have none yet.</span>
              ) : (
                <>
                  <Stack dir="col" scale="2xs">
                    <label element="type--body-small">Billing owner</label>
                    <InputSelect
                      options={buyers.map((b) => ({ value: ownerKey(b.owner), label: b.name }))}
                      value={ownerChoice}
                      onChange={(v) => v && setOwnerChoice(v as string)}
                      data-testid="promotion-owner"
                    />
                  </Stack>
                  <Stack dir="row" scale="md">
                    <Stack dir="col" scale="2xs" className="flex-1">
                      <label element="type--body-small">Amount ({currency.toUpperCase()})</label>
                      <Input value={amount} inputMode="decimal" placeholder="60.00" onChange={setAmount} data-testid="promotion-amount" />
                    </Stack>
                    <Stack dir="col" scale="2xs" className="flex-1">
                      <label element="type--body-small">Expires on</label>
                      <Input type="date" value={expiresOn} onChange={setExpiresOn} data-testid="promotion-expiry" />
                    </Stack>
                  </Stack>
                </>
              )}
              {error && (
                <p element="type--body-small" role="alert" data-testid="vendor-credits-error">
                  {error}
                </p>
              )}
              <Stack dir="row" scale="sm" justify="end">
                <Button emphasis="secondary" scale="sm" disabled={busy} onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  emphasis="primary"
                  scale="sm"
                  startIcon="star"
                  buttonType="icon-text"
                  disabled={busy || cents == null || !expiresOn || !ownerChoice}
                  onClick={() => {
                    const buyer = buyers.find((b) => ownerKey(b.owner) === ownerChoice);
                    if (buyer && cents != null) void run(() => props.onPromote({ owner: buyer.owner, amount: cents, expiresAt: new Date(`${expiresOn}T23:59:59Z`).toISOString() }));
                  }}
                  data-testid="issue-promotion"
                >
                  Give credits
                </Button>
              </Stack>
            </Stack>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SettleSale(
  props: VendorCreditsSheetProps & {
    sale: PurchaseView;
    policy: RefundPolicy;
    amount: string;
    setAmount: (v: string) => void;
    cents: number | null;
    expiry: string;
    run: (action: () => Promise<unknown>) => Promise<void>;
    error: string | null;
  },
): React.ReactElement {
  const { sale, policy, currency, amount, setAmount, cents, expiry, run, error, busy, onClose } = props;
  const c = sale.currency;
  const unsettled = unsettledOf(sale);
  const inCredits = creditsAllowed(sale, policy);
  const inMoney = sale.paidWith === "card" && policy !== "credits";
  return (
    <Stack dir="col" scale="md" data-testid="credit-refund">
      <span element="type--body-small">
        {sale.buyerName} bought {sale.quantity} × {sale.productName} for {money(sale.amountTotal, c)} on {formatDate(sale.createdAt)}, paid {sale.paidWith === "card" ? "by card" : "with your credits"}.
        {sale.refundedAmount > 0 ? ` ${money(sale.refundedAmount, c)} returned as money.` : ""}
        {sale.creditsRefunded > 0 ? ` ${money(sale.creditsRefunded, c)} returned as credits.` : ""}
      </span>
      <span element="type--body-small" emphasis="quiet">
        {sale.paidWith === "vendor_credits"
          ? "Paid with your credits, so it is settled in credits."
          : policy === "credits"
            ? "This product's policy: credits only."
            : policy === "either"
              ? "This product's policy: money through Stripe, or credits."
              : "This product's policy: money only, through the Stripe dashboard."}{" "}
        {unsettled > 0 ? `${money(unsettled, c)} is still unsettled.` : "It is settled."}
      </span>
      {inCredits && unsettled > 0 && (
        <Stack dir="col" scale="2xs">
          <label element="type--body-small">Credits to issue ({currency.toUpperCase()})</label>
          <Input value={amount} inputMode="decimal" onChange={setAmount} data-testid="refund-amount" />
          <span element="type--body-small" emphasis="quiet">
            They expire on {expiry}.
          </span>
        </Stack>
      )}
      {error && (
        <p element="type--body-small" role="alert" data-testid="vendor-credits-error">
          {error}
        </p>
      )}
      <Stack dir="row" scale="sm" justify="end" wrap>
        <Button emphasis="secondary" scale="sm" disabled={busy} onClick={onClose}>
          Close
        </Button>
        {inMoney && unsettled > 0 && (
          <Button emphasis="secondary" scale="sm" startIcon="link" buttonType="icon-text" disabled={busy} onClick={props.onMoneyRefund} data-testid="refund-money">
            Refund money in Stripe
          </Button>
        )}
        {inCredits && unsettled > 0 && (
          <Button
            emphasis="primary"
            scale="sm"
            disabled={busy || cents == null || cents > unsettled}
            onClick={() => cents != null && void run(() => props.onCreditRefund(sale.id, cents))}
            data-testid="issue-credit-refund"
          >
            Issue credits
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
