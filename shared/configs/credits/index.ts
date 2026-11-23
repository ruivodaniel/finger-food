/**
 * Credits — the catalog
 *
 * The platform currency, the metered services, what each costs under each
 * price list, and the welcome credits, as data. Every amount is in cents of
 * the currency: one credit is one cent. An owner with no list assigned pays
 * by the default one; the payment slice assigns the list named after the
 * owner's plan, so every plan key needs a list here (it fails at boot).
 * The catalog validates on import, so a bad entry fails dev, CI and boot alike.
 *
 * PLACEHOLDERS: the amounts below are the design's stand-ins until product
 * sets the real ones. `meteor` is the first real spender.
 *
 * Welcome credits are 0: they are the one source of credits outside access
 * control, so an app turns them on deliberately.
 */

import { defineCreditsCatalog } from "@modules/credits/shared";

export const creditsCatalog = defineCreditsCatalog({
  currency: "eur",
  services: [
    { key: "assistant", name: "Ask the assistant", unit: "question" },
    { key: "meteor", name: "Create a meteor", unit: "meteor" },
  ],
  defaultPriceList: "free",
  priceLists: {
    free: { assistant: 10, meteor: 10 },
    starter: { assistant: 5, meteor: 5 },
    pro: { assistant: 5, meteor: 5 },
  },
  welcome: { user: 0, organization: 0, expiresInDays: 180 },
});
