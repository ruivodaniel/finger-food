/**
 * The credits catalog — the DSL a product fills in `@configs/credits`: the
 * platform currency, the metered services, the price lists and the welcome
 * credits. Pure data, validated at import so a bad catalog fails the build and
 * the boot alike.
 *
 * Every amount is in cents of `currency` — one credit is one cent.
 */

/** A metered feature of the platform. */
export interface CreditService {
  key: string;
  name: string;
  /** what one unit is, for the screens: "question", "meteor" */
  unit: string;
}

/**
 * The price of one unit of each service, in cents. A service absent from the
 * list is not included (refused for entitlement); a price of 0 costs nothing.
 */
export type PriceList = Readonly<Record<string, number>>;

export interface CreditsCatalog {
  /** the platform currency, lower case; credits are cents of it */
  currency: string;
  services: readonly CreditService[];
  /** the price list of an owner with no other assigned */
  defaultPriceList: string;
  priceLists: Readonly<Record<string, PriceList>>;
  /** a one-time lot for every new person and organization; 0 grants nothing; null days never expire */
  welcome: { user: number; organization: number; expiresInDays: number | null };
}

const isKey = (s: string) => /^[a-z][a-z0-9_]*$/.test(s);
const isNonNegativeInt = (n: number) => Number.isInteger(n) && n >= 0;
const isPositiveInt = (n: number) => Number.isInteger(n) && n > 0;

/** Every reason the catalog is wrong, or an empty list. */
export function validateCreditsCatalog(c: CreditsCatalog): string[] {
  const problems: string[] = [];
  if (!/^[a-z]{3}$/.test(c.currency)) problems.push(`currency "${c.currency}" must be a lower-case ISO-4217 code`);

  const services = new Set<string>();
  for (const s of c.services) {
    if (!isKey(s.key)) problems.push(`service key "${s.key}" must be a lower-case identifier`);
    if (services.has(s.key)) problems.push(`service "${s.key}" is listed twice`);
    services.add(s.key);
    if (!s.name || !s.unit) problems.push(`service "${s.key}" needs a name and a unit`);
  }
  for (const [list, prices] of Object.entries(c.priceLists)) {
    if (!isKey(list)) problems.push(`price list key "${list}" must be a lower-case identifier`);
    for (const [service, price] of Object.entries(prices)) {
      if (!services.has(service)) problems.push(`price list "${list}" prices the unknown service "${service}"`);
      if (!isNonNegativeInt(price)) problems.push(`price list "${list}" price of "${service}" must be a non-negative integer`);
    }
  }
  if (!c.priceLists[c.defaultPriceList]) problems.push(`the default price list "${c.defaultPriceList}" does not exist`);

  if (!isNonNegativeInt(c.welcome.user)) problems.push("welcome.user must be a non-negative integer");
  if (!isNonNegativeInt(c.welcome.organization)) problems.push("welcome.organization must be a non-negative integer");
  if (c.welcome.expiresInDays !== null && !isPositiveInt(c.welcome.expiresInDays)) problems.push("welcome.expiresInDays must be a positive integer or null");
  return problems;
}

/** Declare the catalog; throws with every problem when it is not sound. */
export function defineCreditsCatalog(c: CreditsCatalog): CreditsCatalog {
  const problems = validateCreditsCatalog(c);
  if (problems.length) throw new Error(`credits catalog: ${problems.join("; ")}`);
  return c;
}

/** The price list an owner pays by: the one assigned, or the default with none (or an unknown one). */
export function priceListFor(catalog: Pick<CreditsCatalog, "defaultPriceList" | "priceLists">, key: string | null): PriceList {
  return (key != null ? catalog.priceLists[key] : undefined) ?? catalog.priceLists[catalog.defaultPriceList];
}

/** The cents one unit of a service costs under a price list; null when the list does not include it. */
export function unitPrice(catalog: Pick<CreditsCatalog, "defaultPriceList" | "priceLists">, key: string | null, service: string): number | null {
  return priceListFor(catalog, key)[service] ?? null;
}
