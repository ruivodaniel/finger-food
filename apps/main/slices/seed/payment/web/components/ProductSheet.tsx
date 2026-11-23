/**
 * ProductSheet — creates or edits one product: name, description, unit price
 * (typed in the currency, sent in minor units), currency and refund policy.
 * The price lives here and is sent to Checkout at the moment of sale; past
 * purchases keep the name and price they were sold at.
 */

import * as React from "react";
import { Button, Input, InputSelect, Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { REFUND_POLICIES, type ProductView, type RefundPolicy } from "../../shared/types";
import type { ProductInput } from "../lib/api-client";
import { parseMoney } from "../lib/format";

export interface ProductSheetProps {
  /** `new` opens an empty form; a product opens it filled; null keeps it closed */
  editing: ProductView | "new" | null;
  currencies: readonly string[];
  onClose: () => void;
  onSave: (input: ProductInput, product: ProductView | null) => Promise<unknown>;
  busy?: boolean;
}

const POLICY_OPTIONS: { value: RefundPolicy; label: string }[] = REFUND_POLICIES.map((value) => ({
  value,
  label: value === "money" ? "Money, through Stripe" : value === "credits" ? "Credits, spendable on your products" : "Money or credits, your choice each time",
}));

export function ProductSheet({ editing, currencies, onClose, onSave, busy }: ProductSheetProps): React.ReactElement {
  const product = editing && editing !== "new" ? editing : null;
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [currency, setCurrency] = React.useState(currencies[0] ?? "eur");
  const [refundPolicy, setRefundPolicy] = React.useState<RefundPolicy>("money");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(product?.name ?? "");
    setDescription(product?.description ?? "");
    setPrice(product ? (product.unitAmount / 100).toFixed(2) : "");
    setCurrency(product?.currency ?? currencies[0] ?? "eur");
    setRefundPolicy(product?.refundPolicy ?? "money");
    setError(null);
  }, [editing, product, currencies]);

  const unitAmount = parseMoney(price);
  const valid = name.trim().length > 0 && unitAmount != null;

  const save = async () => {
    if (!valid) return;
    setError(null);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined, unitAmount, currency, refundPolicy }, product);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — please try again.");
    }
  };

  return (
    <Sheet open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent data-testid="product-form">
        <SheetHeader><Stack dir="row" align="center" justify="between"><SheetTitle>{product ? `Edit · ${product.name}` : "New product"}</SheetTitle><SheetClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="product-sheet-close-btn" /></SheetClose></Stack></SheetHeader>
        <Stack dir="col" scale="md">
          <Stack dir="col" scale="2xs">
            <label element="type--body-small">Name</label>
            <Input value={name} placeholder="Mix review" onChange={setName} data-testid="product-name" />
          </Stack>
          <Stack dir="col" scale="2xs">
            <label element="type--body-small">Description</label>
            <Input value={description} placeholder="What the buyer gets, and when" onChange={setDescription} data-testid="product-description" />
          </Stack>
          <Stack dir="row" scale="md">
            <Stack dir="col" scale="2xs" className="flex-1">
              <label element="type--body-small">Unit price</label>
              <Input value={price} inputMode="decimal" placeholder="49.00" onChange={setPrice} data-testid="product-price" />
            </Stack>
            <Stack dir="col" scale="2xs" className="w-32">
              <label element="type--body-small">Currency</label>
              <InputSelect
                options={currencies.map((c) => ({ value: c, label: c.toUpperCase() }))}
                value={currency}
                onChange={(v) => v && setCurrency(v as string)}
                data-testid="product-currency"
              />
            </Stack>
          </Stack>
          <Stack dir="col" scale="2xs">
            <label element="type--body-small">Refunds</label>
            <InputSelect options={POLICY_OPTIONS} value={refundPolicy} onChange={(v) => v && setRefundPolicy(v as RefundPolicy)} data-testid="product-refund-policy" />
            <span element="type--body-small" emphasis="quiet">
              How you may settle a purchase of it: money back through Stripe, your own credits the buyer spends on your products, or either.
            </span>
          </Stack>
          <span element="type--body-small" emphasis="quiet">
            Prices are tax-inclusive. Past purchases keep the price and name they were sold at.
          </span>
          {error && (
            <p element="type--body-small" role="alert" data-testid="product-error">
              {error}
            </p>
          )}
          <Stack dir="row" scale="sm" justify="end">
            <Button emphasis="secondary" scale="sm" disabled={busy} onClick={onClose} data-testid="cancel-product">
              Cancel
            </Button>
            <Button emphasis="primary" scale="sm" disabled={busy || !valid} onClick={() => void save()} data-testid="save-product">
              {product ? "Save" : "Create product"}
            </Button>
          </Stack>
        </Stack>
      </SheetContent>
    </Sheet>
  );
}
