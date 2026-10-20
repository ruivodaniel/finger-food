// =============================================================================
// Gate exclude-path matching — segment-aware and mount-prefix-agnostic. The
// middleware sees the full path (`/api/client-v2/...`) but excludes are
// declared relative to the client mount (`/me`). Docker-free.
// =============================================================================

import { describe, it, expect } from "vitest";
import { isExcluded } from "./create-gate-middleware";

const EXCLUDES = ["/gate/check", "/legal/", "/me", "/invitations/"];
const at = (p: string) => `/api/client-v2${p}`;

describe("gate exclude matching", () => {
  it("excludes the /me subtree and exact /me", () => {
    expect(isExcluded(at("/me"), EXCLUDES)).toBe(true);
    expect(isExcluded(at("/me/memberships"), EXCLUDES)).toBe(true);
    expect(isExcluded(at("/me/security/totp/enroll"), EXCLUDES)).toBe(true);
  });

  it("does NOT treat /organizations/:id/members as /me", () => {
    expect(isExcluded(at("/organizations/x/members"), EXCLUDES)).toBe(false);
    expect(isExcluded(at("/organizations/x"), EXCLUDES)).toBe(false);
  });

  it("a trailing-slash exclude matches only the subtree", () => {
    // /invitations/ excludes the public accept surface…
    expect(isExcluded(at("/invitations/abc"), EXCLUDES)).toBe(true);
    // …but NOT the org-scoped invitation list (that stays gated)
    expect(isExcluded(at("/organizations/x/invitations"), EXCLUDES)).toBe(
      false,
    );
  });

  it("excludes /legal/ children and /gate/check exactly", () => {
    expect(isExcluded(at("/legal/consent"), EXCLUDES)).toBe(true);
    expect(isExcluded(at("/legal/documents/current"), EXCLUDES)).toBe(true);
    expect(isExcluded(at("/gate/check"), EXCLUDES)).toBe(true);
  });

  it("gates a normal org path", () => {
    expect(isExcluded(at("/organizations"), EXCLUDES)).toBe(false);
  });
});
