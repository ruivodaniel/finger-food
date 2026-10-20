/**
 * Product defaults for the list-query contract.
 *
 * Single source of truth for the values every list endpoint defaults
 * to when the client sends nothing. Re-exports the lib baseline so the
 * product can override any of the three without touching the lib or
 * every endpoint call site.
 *
 * Three-tier fallback:
 *   lib baseline → this file → per-endpoint override
 */

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type ListQueryDefaults,
} from "@libs/list-query";

/**
 * Canonical pagination defaults for this product.
 *
 * Every list endpoint's zod factory call site should pass this
 * object unless it has a specific reason to diverge.
 */
export const LIST_QUERY_DEFAULTS: ListQueryDefaults = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  maxPageSize: MAX_PAGE_SIZE,
};
