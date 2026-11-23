/**
 * The marketplace components rendered to HTML (React's server renderer, no
 * browser): what each one shows in each state. The pages around them are
 * hook-driven and are exercised in the app.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ProductView, PurchaseView } from "../../shared/types";
import { ProductsTable } from "./ProductsTable";
import { PurchasesTable } from "./PurchasesTable";
import { SalesTable } from "./SalesTable";
import { VendorCard } from "./VendorCard";
import { VendorCreditsCard } from "./VendorCreditsCard";
import { creditsAllowed, unsettledOf } from "./VendorCreditsSheet";

/** The text a person reads, tags and whitespace collapsed. */
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
const noop = () => {};

const product: ProductView = {
  id: "p-mix", organizationId: "o-borealis", vendorName: "Borealis Labs", name: "Mix review", description: "One mix, three days.",
  unitAmount: 4900, currency: "eur", refundPolicy: "either", active: true,
};
const sale: PurchaseView = {
  id: "pu-1", buyer: { organizationId: "o-acme" }, buyerName: "Acme Corp", sellerOrganizationId: "o-borealis", sellerName: "Borealis Labs",
  productId: "p-mix", productName: "Mix review", quantity: 2, paidWith: "card", amountTotal: 9800, currency: "eur", applicationFeeAmount: 980,
  refundedAmount: 2000, refundedAt: "2026-02-17T11:00:00.000Z", creditsRefunded: 0, createdAt: "2026-02-15T15:20:00.000Z",
};

describe("VendorCard", () => {
  it("offers to start onboarding before there is an account (UC62)", () => {
    const html = renderToStaticMarkup(<VendorCard status={{ hasAccount: false, chargesEnabled: false }} platformFeePercent={10} onOnboarding={noop} onDashboard={noop} />);
    expect(text(html)).toContain("not started");
    expect(html).toContain('data-testid="start-onboarding"');
    expect(html).not.toContain('data-testid="open-dashboard"');
  });

  it("offers to continue an unfinished onboarding, and the dashboard (UC63, UC65)", () => {
    const html = renderToStaticMarkup(<VendorCard status={{ hasAccount: true, chargesEnabled: false }} platformFeePercent={10} onOnboarding={noop} onDashboard={noop} />);
    expect(text(html)).toContain("onboarding incomplete");
    expect(html).toContain('data-testid="continue-onboarding"');
    expect(html).toContain('data-testid="open-dashboard"');
  });

  it("says the vendor can take payments, and what the platform keeps", () => {
    const html = renderToStaticMarkup(<VendorCard status={{ hasAccount: true, chargesEnabled: true }} platformFeePercent={10} onOnboarding={noop} onDashboard={noop} />);
    expect(text(html)).toContain("can take payments");
    expect(text(html)).toContain("The platform keeps 10% of each card sale.");
    expect(html).not.toContain("onboarding\"");
  });
});

describe("ProductsTable", () => {
  it("shows each product's price, refund policy and listing, with edit and archive or restore (UC66, UC74, UC77)", () => {
    const html = renderToStaticMarkup(
      <ProductsTable rows={[product, { ...product, id: "p-stems", name: "Stem cleanup", active: false, refundPolicy: "money" }]} canCreate onNew={noop} onEdit={noop} onToggleActive={noop} />,
    );
    const t = text(html);
    expect(t).toContain("Mix review");
    expect(t).toContain("€49.00");
    expect(t).toContain("money or credits");
    expect(t).toContain("in the Marketplace");
    expect(t).toContain("archived");
    expect(html).toContain('data-testid="archive-p-mix"');
    expect(html).toContain('data-testid="restore-p-stems"');
  });

  it("explains why no product can be created before Stripe confirms the account", () => {
    const html = renderToStaticMarkup(<ProductsTable rows={[]} canCreate={false} onNew={noop} onEdit={noop} onToggleActive={noop} />);
    expect(text(html)).toContain("once Stripe confirms the account can take payments");
    expect(html).toMatch(/data-testid="new-product"[^>]*disabled|disabled[^>]*data-testid="new-product"/);
  });
});

describe("SalesTable and PurchasesTable", () => {
  it("names the buyer on a vendor's sale, with the fee and the money refunded (UC79, UC90)", () => {
    const t = text(renderToStaticMarkup(<SalesTable rows={[sale]} total={1} page={1} pageSize={20} onPageChange={noop} />));
    expect(t).toContain("Acme Corp");
    expect(t).toContain("€98.00");
    expect(t).toContain("€9.80");
    expect(t).toContain("€20.00");
  });

  it("names the vendor on a buyer's purchase and says how it was paid (UC87, UC89)", () => {
    const full = { ...sale, refundedAmount: 9800 };
    const t = text(renderToStaticMarkup(<PurchasesTable rows={[full]} total={1} page={1} pageSize={20} onPageChange={noop} />));
    expect(t).toContain("Borealis Labs");
    expect(t).toContain("card");
    expect(t).toContain("in full");
  });

  it("offers to settle a sale in credits only where the vendor said it can (UC127, UC128)", () => {
    const html = renderToStaticMarkup(
      <SalesTable rows={[sale, { ...sale, id: "pu-2" }]} total={2} page={1} pageSize={20} onPageChange={noop} canSettleInCredits={(s) => s.id === "pu-1"} onSettle={noop} />,
    );
    expect(html).toContain('data-testid="credit-refund-pu-1"');
    expect(html).not.toContain('data-testid="credit-refund-pu-2"');
    expect(renderToStaticMarkup(<SalesTable rows={[sale]} total={1} page={1} pageSize={20} onPageChange={noop} />)).not.toContain("Refund as credits");
  });

  it("says when nothing was bought or sold yet (UC81)", () => {
    expect(text(renderToStaticMarkup(<SalesTable rows={[]} total={0} page={1} pageSize={20} onPageChange={noop} />))).toContain("No sales yet.");
    expect(text(renderToStaticMarkup(<PurchasesTable rows={[]} total={0} page={1} pageSize={20} onPageChange={noop} />))).toContain("Nothing bought yet.");
  });
});

describe("vendor credits", () => {
  it("shows what the vendor issued, what it still owes and to whom, with the way to a promotion (UC134)", () => {
    const html = renderToStaticMarkup(
      <VendorCreditsCard
        credits={{
          currency: "eur", issued: 10900, outstanding: 4900,
          holders: [{ owner: { organizationId: "o-acme" }, ownerName: "Acme Corp", remaining: 4900, soonestExpiry: "2026-08-17T11:00:00.000Z" }],
        }}
        onPromote={noop}
      />,
    );
    const t = text(html);
    expect(t).toContain("€49.00 outstanding");
    expect(t).toContain("€109.00 issued in all");
    expect(t).toContain("Acme Corp");
    expect(html).toContain('data-testid="give-promotion"');
  });

  it("settles in credits a sale paid with them whatever the policy, and a card sale only when the policy allows (UC128, UC130)", () => {
    expect(creditsAllowed({ paidWith: "vendor_credits" }, "money")).toBe(true);
    expect(creditsAllowed({ paidWith: "card" }, "money")).toBe(false);
    expect(creditsAllowed({ paidWith: "card" }, "either")).toBe(true);
    expect(creditsAllowed({ paidWith: "card" }, "credits")).toBe(true);
  });

  it("counts what is still unsettled after money and credits came back (UC129)", () => {
    expect(unsettledOf({ amountTotal: 4900, refundedAmount: 900, creditsRefunded: 2000 })).toBe(2000);
    expect(unsettledOf({ amountTotal: 4900, refundedAmount: 4900, creditsRefunded: 2000 })).toBe(0);
  });
});
