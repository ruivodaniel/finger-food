/**
 * Cast — fixture demo users used to snapshot authenticated pages.
 *
 * Public shape (committed). Passwords live in `cast.local.ts` — also
 * committed because these are throwaway local-dev fixture accounts.
 *
 * Adding a cast member:
 *  1. Add an entry here (id, label, email, optional notes)
 *  2. Add the matching password to cast.local.ts
 *  3. Re-bootstrap session by clicking "Sign in" on the cast member in
 *     the Snapshots manager. Saved session lives at .auth/<id>.json.
 */

export type CastMember = {
  /** Stable slug. Used as filename for the saved Playwright session
   *  (`sandbox/_snapshots/.auth/<id>.json`) and to look up password. */
  id: string;
  label: string;
  email: string;
  /** Free-form note for humans — what role/permissions this user has. */
  notes?: string;
};

export const CAST: CastMember[] = [
  {
    id: "daniel",
    label: "Daniel",
    email: "danielcastroruivo@gmail.com",
    notes: "Default authenticated cast. Most pages snapshot with active org = Platform Admin.",
  },
  {
    id: "dorothy",
    label: "Dorothy",
    email: "dorothy@example.com",
    notes: "Reserved for future registry pages.",
  },
];
