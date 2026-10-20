/**
 * Route contribution types — framework-agnostic route definitions. The module
 * expresses access intent; the app interprets that into its own shell.
 *
 * Pages travel inside these objects and are self-sufficient: URL data arrives
 * as plain props via the optional `makeProps` transformer, adapters come from
 * provider context, and pages never call router hooks.
 */

import type { ComponentType } from "react";

export type RouteAccess = "public" | "authenticated";

/** URL data the route layer extracts and hands to `makeProps`. */
export interface RouteContext {
  params: Record<string, string | undefined>;
  search: Record<string, unknown>;
  hash?: string;
}

// A RouteDefinition[] mixes pages with different prop shapes; the boundary
// stays loose on purpose — strictness lives inside each page.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMakeProps = (ctx: RouteContext) => any;

export interface RouteDefinition {
  path: string;
  page: AnyComponent;
  makeProps?: AnyMakeProps;
  access: RouteAccess;
  meta?: {
    title?: string;
  };
}
