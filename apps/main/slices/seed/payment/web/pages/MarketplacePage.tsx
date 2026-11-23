/**
 * MarketplacePage — every active product of every vendor, as cards, with a
 * search by name, and where the buyer holds credits: which vendors, and on
 * each card whether those credits pay for it. Buying happens on the product
 * page; the buyer is the active organization, or the person when no
 * organization is active.
 */

import * as React from "react";
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, EmptyState, Input } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ListPagination } from "@libs/list-query/client";
import { paymentPaths } from "../../shared/paths";
import { useMarketplace } from "../hooks/use-marketplace";
import { isUnavailable } from "../lib/api-client";
import { money } from "../lib/format";
import { usePaymentContext } from "../services/application/mount";

const PAGE_SIZE = 24;

export function MarketplacePage(): React.ReactElement | null {
  const { activeOrganization, credits, navigate } = usePaymentContext();
  const [typed, setTyped] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const listing = useMarketplace({ search, page, pageSize: PAGE_SIZE });
  // what the buyer holds at vendors; nothing shows for a member who cannot see the account
  const held = credits.useVendorHoldings({ scope: activeOrganization ? "organization" : "account", organizationId: activeOrganization?.id ?? null });
  const holdings = held?.vendors ?? [];
  const heldAt = (vendorId: string, currency: string) =>
    currency === held?.currency ? (holdings.find((v) => v.vendorOrganizationId === vendorId)?.amount ?? 0) : 0;

  // look up after the person stops typing, from the first page
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(typed.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [typed]);

  if (isUnavailable(listing.error)) return null;
  const open = (productId: string) => navigate(paymentPaths.product(productId));
  const rows = listing.data?.rows ?? [];

  return (
    <Stack dir="col" scale="xl" className="w-full max-w-5xl" data-testid="marketplace-page">
      <Stack dir="col" scale="2xs">
        <h2 element="type--heading3">Marketplace</h2>
        <span element="type--body-small" emphasis="quiet">
          Products sold by organizations on the platform. You buy as {activeOrganization?.name || "yourself"}.
        </span>
      </Stack>
      {holdings.length > 0 && (
        <Stack dir="row" scale="sm" wrap align="center" data-testid="vendor-credits">
          <span element="type--body-small" emphasis="quiet">
            {activeOrganization?.name || "You"} {activeOrganization ? "holds" : "hold"} credits at:
          </span>
          {holdings.map((v) => (
            <Badge key={v.vendorOrganizationId} status="warning">
              {v.vendorName} · {money(v.amount, held!.currency)}
            </Badge>
          ))}
        </Stack>
      )}
      <Input value={typed} placeholder="Search products" onChange={setTyped} className="max-w-md" data-testid="marketplace-search" />
      {listing.isPending ? null : rows.length === 0 ? (
        <EmptyState title={search ? `No product matches "${search}".` : "Nothing is for sale yet."} data-testid="marketplace-empty" />
      ) : (
        <Stack dir="row" scale="lg" wrap>
          {rows.map((p) => (
            <Card key={p.id} className="w-72" data-testid={`product-${p.id}`}>
              <CardHeader>
                <Stack dir="col" scale="3xs">
                  <h3 element="type--heading4">{p.name}</h3>
                  <span element="type--body-small" emphasis="quiet">
                    by {p.vendorName}
                  </span>
                </Stack>
              </CardHeader>
              <CardContent>
                <Stack dir="col" scale="sm">
                  <span element="type--body-small">{p.description ?? ""}</span>
                  {heldAt(p.organizationId, p.currency) > 0 && (
                    <span element="type--body-small" status={heldAt(p.organizationId, p.currency) >= p.unitAmount ? "success" : "warning"} data-testid={`credits-hint-${p.id}`}>
                      {heldAt(p.organizationId, p.currency) >= p.unitAmount
                        ? "payable with your credits here"
                        : `${money(heldAt(p.organizationId, p.currency), p.currency)} in credits here, short of the price`}
                    </span>
                  )}
                </Stack>
              </CardContent>
              <CardFooter>
                <Stack dir="row" align="center" scale="sm" justify="between" className="w-full">
                  <span element="type--heading4">{money(p.unitAmount, p.currency)}</span>
                  <Button emphasis="secondary" scale="sm" onClick={() => open(p.id)} data-testid={`open-${p.id}`}>
                    View
                  </Button>
                </Stack>
              </CardFooter>
            </Card>
          ))}
        </Stack>
      )}
      {(listing.data?.total ?? 0) > PAGE_SIZE && <ListPagination query={{ page, pageSize: PAGE_SIZE }} total={listing.data?.total ?? 0} onPageChange={setPage} />}
    </Stack>
  );
}
