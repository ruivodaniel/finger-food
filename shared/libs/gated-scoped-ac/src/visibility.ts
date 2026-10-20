// The public/private visibility token (pilot part 06). NOT a flag on the bag (a
// single point of failure); a required, strictly-typed token threaded through
// every layer and asserted at each. `Private` structurally extends `Public`, so
// `Private` is assignable where `Public` is required, but NEVER the reverse — a
// public flow can never escalate to private (that escalation is a compile error).

export type Public = { readonly visibility: "public" };
export type Private = Public & { readonly secret: true };

export const PUBLIC: Public = { visibility: "public" };
export const PRIVATE: Private = { visibility: "public", secret: true };

// runtime backstop ("one disagrees, throws") — types catch most at compile time
export function isPrivate(visibility: Public): visibility is Private {
  return (visibility as Private).secret === true;
}
