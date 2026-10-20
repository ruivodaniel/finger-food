# Auth and the gate

## The auth service: the provider owns the conversation

The module keeps **no flow records**. A credential conversation is the
provider's own flow, and the client holds its id. `AuthService` adds only
what the provider cannot know:

- **product policy** — which identifier may register with which factor, whether
  open signup is allowed at all (read from the frozen auth-config via the pure
  resolvers, never re-implemented);
- **the app's user row**, plus the consent and profile records the provider has
  no concept of;
- **uniform errors**, so nothing leaks (see "No existence leaks" below).

Because the provider holds the flow state, the client can't re-negotiate what
the config granted: it can only submit against a flow the server started, and
every policy check runs again server-side on the submit.

## Registration — one screen, one birth

Every registration is a code registration: the code IS the credential proof,
so the identity is born the moment it is proven — address verified from birth
— and before that moment nothing exists anywhere but the provider's expiring
flow record.

```
GET  /auth/config?intent=registration&identifier=email
     → identifiers, factors, profileFields, consent   (what the screen must ask)

POST /auth/registration   { identifierType, identifierValue,
                            name?, consents?, password? }
     → the policy gauntlet runs (fast feedback for the form: identifier
       allowed, signup allowed, required profile, password policy), then the
       code is delivered. NOTHING exists yet — the password included: it
       stays with the client and rides the verify request
     → 202 { codeSent: true, flowId }

POST /auth/registration/verify   { flowId, identifier, code,
                                   name?, consents?, password? }
     → the gauntlet re-runs, authoritatively, while nothing exists yet
     → proves the delivered code — THE identity is born, address verified
       (the code was the proof), password SET on the fresh session when the
       config collects one, name + consent recorded
     → 201 { user }, signed in
```

**The verify request is the atomic carrier.** Code, name, consents, and
password travel together, so there is no moment where an account exists with
its answers still in transit — either the whole thing lands, or nothing
exists. A password identifier's password is a settings write at birth, never
the registration credential; a config that collects one demands it at BOTH
steps, so a hand-crafted verify can't slip past it.

**The DSL is the ONE authority on password acceptability.** The provider's
own judgment calls are pinned off in its config (kratos.yml), the config
validator keeps every DSL policy at or above the provider's hard floor
(minLength ≥ 8; the shared check mirrors bcrypt's 72-byte max), and the form
validates live with the SAME shared function the auth service enforces pre-birth
(`shared/auth-config/password-policy`). A password the form accepted is a
password the birth accepts.

After birth, failures degrade instead of stranding: a failed password WRITE
(infrastructure, not policy) leaves a verified, passwordless account — code
login and recovery both still work, and recovery sets a password; a failed
consent or profile write is collected by the gate at `/resolve`. The account
the provider accepted always stands. One failsafe guards the day a provider
upgrade grows a password check the DSL doesn't know: a provider POLICY
refusal at birth unbirths the seconds-old identity and answers a plain 400,
so the retry is a clean redo — never a silent passwordless 201.

### Invitations

Accepting is always a **signed-in** action. A newcomer invited to an org
registers plainly, returns via their intention, and accepts while signed in —
the accept seats the membership, re-checks match strictness, records org-typed
consent, and auto-verifies the invited address (possession was proven by
delivery). See [organizations.md](./organizations.md).

## Login

```
POST /auth/login                { identifier, password }
POST /auth/login/code/start     { identifier }              → { flowId }
POST /auth/login/code/complete  { flowId, identifier, code }
```

- **Password**: one call. Factor availability comes from the config; ANY failure
  (wrong password, unknown identifier, provider error) maps to one uniform 401.
  An identity provisioned outside a flow (a seeded admin) gets its app user row
  on first login (self-heal).
- **Code (OTP)**: `start` ALWAYS answers with a flow id — see the masking note.

### 2FA — the gate's demand, not login's

Login has no second step. Every credential proof signs the caller in at
whatever AAL it earned; a config that wants a TOTP-verified session says so
with a membership-keyed `totp` rule, and THE GATE blocks the AAL1 session with
`428 factor_session_verified(totp)` until the caller raises it on their live
session:

```
POST /me/security/step-up  { code, method: totp | backup_code }  → AAL2
```

(`/me` is gate-excluded, so the step-up surface stays reachable while gated.)
Consequence to know: TOTP protects exactly what the gate protects. An enrolled
user with no gate-demanding membership gets no login-time enforcement from it —
enrolment alone changes nothing about how they sign in.

## Recovery

```
POST /auth/recovery/start     { identifier }               → { flowId }   (masked)
POST /auth/recovery/complete  { flowId, identifier, code } → signed in (cookie)
POST /auth/recovery/finish    { newPassword }                (a signed-in action)
```

Proving the code is a credential proof, so it signs the caller in like any
other. `finish` acts on that session: it sets the new password (DSL policy
first) and **revokes every session — the calling one included**, so only a
fresh login works afterwards. The privileged window ends there.

UNIFORM for every account: nothing about the account's credentials is disclosed
(the response never reveals whether a password already existed), and the finish
always sets or rotates one.

Channel: the provider's recovery flow is email-only (its form validates email
format), so **sms recovery rides the code-login proof** — the same delivered
secret, equally fresh authentication for the privileged session.

## No existence leaks

Kratos's code-login start REFUSES an unknown identifier with a distinct error
(message `4000035`, "This account does not exist…"), which would make accounts
enumerable by anyone who can POST. The auth service therefore never passes that through:

- `loginCodeStart` and `recoveryStart` **always** answer with a flow id — the
  real one when the provider started a flow, an indistinguishable **decoy** when
  it refused. A decoy simply fails at submit, exactly like a wrong code.
- Password login is already uniform provider-side (wrong password and unknown
  account return the same message); the auth service maps every failure to one 401
  regardless.

## Account security (signed-in)

`/me/security/*` — the caller's own 2FA controls. Every one acts on the session
token from the caller's OWN cookie (never a request-supplied id), and that
token never appears in a response:

```
GET  /me/security              { totpEnrolled, backupCodesGenerated }
POST /me/security/totp/enroll  → { flowId, totpSecret, qrDataUrl }
POST /me/security/totp/confirm { flowId, code } → { backupCodes }  (shown once)
POST /me/security/backup-codes → { backupCodes }  (regenerate)
POST /me/security/step-up      { code, method }   raise the session to AAL2
POST /me/security/totp/disable requires a prior step-up (provider demands AAL2)
POST /me/security/sessions/revoke-others   sign out every other device. Native
                               to the provider: with no session table of our own
                               there is no second store that could disagree about
                               which sessions are live. The caller's survives.
```

## The gate: live evaluation, facts not verdicts

The gate stores **no verdict**. Per request:

1. Resolve obligations from the **current** config for two families of context
   (see [Two families of context](#two-families-of-context) below):
   - **membership** — `{membershipOrgType}` + one per held role. Everything a
     matching rule demands stands, session facts included.
   - **registration invariants** — `{intent: "registration"}`, plus one context
     per identifier type the caller **owns**. Persistent requirements only.
2. Check each obligation against **live facts**:
   - `identifier_verified` → provider's verifiable addresses
   - `factor_session_verified` → this session's proven methods / AAL
   - `profile_data_provided` → profile row (fixed columns, then `data[field]`)
   - `legal_consent_granted` → consent record at the CURRENT published
     version (unpublished document = waived + warning, never bricks the app)
3. Unmet obligations → `428 { obligations }`; the client routes blocked
   callers to `/resolve` through two layers. On NAVIGATION, the app's route
   guard — attached to the whole signed-in shell, so every signed-in page is
   gated by default — probes `gate/check` and redirects to `/resolve` with
   the blocked page as `?intention=`. On any IN-PAGE request that lands 428,
   the module's client fires its gate-blocked hook and the provider does the
   same redirect — seeding the gate query so `/resolve` paints instantly,
   latching so a burst of parallel 428s navigates once, and skipping only
   `/resolve` itself so a caller mid-resolution is never yanked away.
   `?intention=` carries only in-app paths; `/resolve`'s Continue button
   takes the caller back. EVERY obligation resolves ON `/resolve`: the page
   is a wizard that mounts one resolver at a time, in the gate's order —
   LEGAL CONSENT FIRST, from every scope (ReconsentCard — see
   [legal.md](./legal.md), fed by `GET /legal/consent/pending`): a caller
   agrees to the terms before anything else is asked of them. Then the rest
   in the order the gate collected them — identifiers (IdentifierResolution),
   TOTP (TwoFactorCard), profile fields (ProfileDataForm). The page
   exemptions that used to shadow the server's excludePaths
   (`/account/profile`, `/account/security`) are gone; the ENDPOINT excludes
   (`/me`, `/legal/`) remain — resolution must stay callable while blocked.

Consequences, by design:

- Add an obligation to the config (or publish a new T&C version) and every
  existing user who doesn't meet it is blocked on their **next request** —
  no migration, no stale "gate passed" flag.
- The db stores facts (consents, profile fields), the provider stores facts
  (verified addresses, session methods); requirements live only in config.
  Facts can't go stale; requirements are always current.
- The only cache anywhere is a ~30s whoami facts cache. Never cache a
  verdict.

Membership facts are **live** and ride on the **session**: the session
middleware resolves the caller's org-context once (`SessionService.resolve`
via `MembershipService.listMemberships`) — active org + membership roles — and
the gate reads the roles off `c.get("session").memberships` rather than
re-fetching.

## Two families of context

The gate reads the same config through two lenses, and the difference is the
whole design.

**Membership contexts** are unfiltered. Belonging to an org is what makes its
demands legitimate, so _everything_ a matching rule asks for stands — session
facts included (an org type may demand a password-verified session, or a TOTP
step-up for a role). An obligation the caller cannot satisfy yet — a verified
email they don't have — is a real instruction: go add one.

The identifiers MAP joins this lens as an invariant: every membership context
keeps at least one identifier type it accepts. The map carries no `require` of
its own, so the gate derives it — a caller who owns _only_ types a context
excludes gets an `identifier_present` obligation listing the types that
context accepts (any one satisfies it). Holding an excluded type is fine;
holding nothing else is not. This is also why removing an identifier is never
refused for config reasons: the mutation stays permissive, and the gate walks
the caller back through `/resolve` — the same answer it gives a phone-only
user who _joins_ such an org by invitation.

**Registration invariants** answer a question flows can't. Registration is
where the product states what an account must carry (a verified address, a
name, platform consent), but a flow only enforces its rules _while it runs_.
Birth-at-verify means the registering address can't leave unverified anymore —
what the invariants still guard is everything else that can drift afterwards:
an identifier ADDED post-birth whose verification was abandoned, a consent or
profile write that failed at birth, an account seeded outside the flow. So the
gate re-checks what registration establishes, evaluating
`{intent: "registration"}` for every signed-in caller. Two filters keep that
honest:

- **Persistent requirements only.** `factor_session_verified` describes the
  moment credentials are proven, not a fact the account carries. Made standing
  it would pin every session to the method registration used — and a config
  that offers both password and code login (ours does) would gate its own
  login.
- **Owned identifier types only.** "Registration requires a verified email"
  means _if this account has an email, it is verified_ — not _every account
  must grow one_. A phone-only account owes nothing about email. This is
  precisely why membership rules skip the filter: an org that genuinely demands
  an address the caller lacks says so with a membership-keyed rule.

Both families fold in the caller's org types, so a `notWhen` carve-out — the
`system_admin` break-glass exemption from consent — keeps holding in either
lens. Scoping differs, though: registration-invariant CONSENT is checked at
the PLATFORM scope (where registration records it) for every signed-in
caller, so a republished platform document re-gates members and org-less
callers alike; org-typed documents are the membership lens's demand.

The DSL is untouched by this: no new keys, no rule migration. `intent:
"registration"` + a persistent requirement simply _means_ "an account
invariant", and the gate is its second reader (the registration flow being the
first). Cost is one provider identity read per gated request, shared with the
obligation checks below it.

Consequences, by design:

- An account is born with its registering address verified, so no window
  exists in which a fresh unverified account roams a gated app. Anyone who
  abandons the code step simply has no account.
- A seeded `system_admin` owner owes the config's admin standing obligations —
  verified email, a password-verified session, and TOTP. TOTP can't be seeded,
  so on first login the admin is `428`-blocked and lands in the `/resolve`
  wizard, which mounts the enrolment flow in place (its `/me/security/*`
  endpoints are under the gate's `/me` exclude prefix, so they answer while
  gated). This is correct behaviour, not a seed bug — the gate is doing its
  job.
- Adding an identifier and abandoning _its_ verification gates you until you
  finish. Consistent with "verify what you own", and deliberate.
