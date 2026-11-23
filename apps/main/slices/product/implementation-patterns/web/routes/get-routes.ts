/**
 * The route declaration — this slice's pages as a tree of nodes, as data (@libs/web-routing).
 * Gated, in the application shell: /implementation-patterns · /implementation-patterns/minesweeper ·
 * /implementation-patterns/meteors · …/meteors/new · …/meteors/$meteorId · …/meteors/$meteorId/edit.
 * Public, no session: /public/meteors · /public/meteors/$meteorId.
 */
import type { RouteContext, RouteNode } from "@libs/web-routing";
import { PatternsPage } from "../pages/patterns/PatternsPage";
import { MinesweeperPage } from "../pages/minesweeper/MinesweeperPage";
import { MeteorsPage } from "../pages/meteors/MeteorsPage";
import { MeteorPage } from "../pages/meteor/MeteorPage";
import { OrgMeteorsPage } from "../pages/org-meteors/OrgMeteorsPage";
import { OrgMeteorPage } from "../pages/org-meteor/OrgMeteorPage";
import { OrgMeteorNewPage } from "../pages/org-meteor-new/OrgMeteorNewPage";
import { OrgMeteorEditPage } from "../pages/org-meteor-edit/OrgMeteorEditPage";
import { PatternsLayout } from "../shared/layouts/PatternsLayout";
import { PublicMeteorsLayout } from "../shared/layouts/PublicMeteorsLayout";

export interface GetRoutesOptions {
  /** Where the patterns' pages live (default /implementation-patterns). The meteors sit under it, at /meteors. */
  patternsPath?: string;
  /** Where the public meteor pages live (default /public/meteors). */
  publicPath?: string;
}

export function getImplementationPatternsRoutes(options: GetRoutesOptions = {}): RouteNode[] {
  const { patternsPath = "/implementation-patterns", publicPath = "/public/meteors" } = options;
  const meteorsPath = `${patternsPath}/meteors`;
  const page = (ctx: RouteContext) => Number(ctx.search.page ?? 1) || 1;
  const search = (ctx: RouteContext) => (typeof ctx.search.search === "string" ? ctx.search.search : "");
  return [
    {
      access: "public",
      path: publicPath,
      layout: PublicMeteorsLayout,
      children: [
        { path: "/", page: MeteorsPage, makeProps: (ctx) => ({ page: page(ctx), search: search(ctx), publicPath }) },
        { path: "$meteorId", page: MeteorPage, makeProps: (ctx) => ({ meteorId: ctx.params.meteorId ?? "", publicPath }) },
      ],
    },
    {
      access: "gated",
      path: patternsPath,
      layout: PatternsLayout,
      children: [
        { path: "/", page: PatternsPage, makeProps: () => ({ patternsPath }) },
        { path: "minesweeper", page: MinesweeperPage, makeProps: () => ({}) },
        { path: "meteors", page: OrgMeteorsPage, makeProps: (ctx) => ({ page: page(ctx), search: search(ctx), meteorsPath }) },
        { path: "meteors/new", page: OrgMeteorNewPage, makeProps: () => ({ meteorsPath }) },
        { path: "meteors/$meteorId", page: OrgMeteorPage, makeProps: (ctx) => ({ meteorId: ctx.params.meteorId ?? "", meteorsPath }) },
        { path: "meteors/$meteorId/edit", page: OrgMeteorEditPage, makeProps: (ctx) => ({ meteorId: ctx.params.meteorId ?? "", meteorsPath }) },
      ],
    },
  ];
}
