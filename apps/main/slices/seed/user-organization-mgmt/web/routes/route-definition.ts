/**
 * Route contribution types — framework-agnostic route definitions. The
 * module expresses access intent; the app interprets that into its own
 * shell structure.
 *
 * Pages travel inside these objects (direct component references, no
 * wrappers) and are self-sufficient: URL data arrives as plain props via
 * the optional `makeProps` transformer; adapters come from provider
 * context. Pages never call router hooks.
 */

import type { ComponentType } from "react";

/**
 * - "public" — no authentication required
 * - "authenticated" — requires login
 */
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
  /** URL path (may include params). */
  path: string;
  /** React component to render (internal — not exported separately). */
  page: AnyComponent;
  /** Pure transformer from URL data to plain page props. Defaults to
   * spreading `{...params, ...search}`. */
  makeProps?: AnyMakeProps;
  /** Access level — the module expresses intent, the app decides structure. */
  access: RouteAccess;
  meta?: {
    title?: string;
  };
}
