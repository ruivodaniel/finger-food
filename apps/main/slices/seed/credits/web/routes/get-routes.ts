/**
 * The route declaration — this slice's pages as a tree of nodes, as data (@libs/web-routing). The person's credits live in
 * their settings, a section the user-organization-mgmt slice owns: the app hands `personalCreditsRoute` to that slice.
 */

import type { RouteContext, RouteNode } from "@libs/web-routing";
import { creditsPaths } from "../../shared/paths";
import { CreditGrantsPage } from "../pages/credit-grants/CreditGrantsPage";
import { CreditsPage } from "../pages/credits/CreditsPage";
import { CreditsLayout } from "../shared/layouts/CreditsLayout";

/** `$organizationId` is an id or the literal `current` (the active organization). */
const organizationOf = (ctx: RouteContext): string => ctx.params.organizationId ?? "current";

/** The person's own credits, as a child of the settings section. */
export const personalCreditsRoute: RouteNode = {
  path: creditsPaths.personalCredits.split("/").pop(),
  page: CreditsPage,
  makeProps: () => ({ scope: "account" }),
  nav: { title: "Credits" },
};

export function getCreditsRoutes(): RouteNode[] {
  return [
    {
      access: "gated",
      id: "credits",
      layout: CreditsLayout,
      children: [
        {
          path: creditsPaths.organizationCredits("$organizationId"),
          page: CreditsPage,
          makeProps: (ctx) => ({ scope: "organization", organizationId: organizationOf(ctx) }),
        },
        // the platform owner's admin grants, with the platform organization active
        { path: creditsPaths.creditGrants, page: CreditGrantsPage, makeProps: () => ({}) },
      ],
    },
  ];
}
