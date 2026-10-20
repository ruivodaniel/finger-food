# The auth-config DSL

The module ships the engine (`shared/auth-config/`: types, resolver,
validation); the product ships the config instance
(`configs/user-organization-mgmt/auth/`). Add a rule to the config and every
consumer — registration flow, login form, the gate — picks it up with no
code change.

## Two orthogonal axes

Any auth moment is described by two single-valued axes:

- **intent** — the credential flow: `registration | authentication | recovery`
- **orgAction** — how a membership is being established: `create | join`
  (absent for login, recovery, and the gate)

They are separate axes because a flat intent list made contradictory
combinations expressible (registration+authentication) and couldn't say
"register AND create a company".

## Condition semantics (memorize this)

```ts
when: [clauseA, clauseB]   // clauseA OR clauseB   (any-of)
{ intent: "registration", membershipOrgType: "company" }  // AND within a clause
{ intent: ["registration", "authentication"] }            // any-of within a key
notWhen: [clauseC]         // ...AND NOT clauseC (veto, same clause semantics)
```

A clause matches when EVERY key it names is present in the context with an
allowed value. Two consequences that bite:

1. **A clause naming a field the context lacks does NOT match.** The gate
   evaluates membership contexts with no `intent` — so a clause that includes
   `intent` can never fire at the gate.
2. **Extra context fields don't prevent matching** (subset check). A clause
   `{ membershipOrgType: "company" }` fires both during a company-targeted
   registration (whose context also carries `intent`) and at the standing
   gate.

## The authoring convention (the "two species" rule)

- **Intent-keyed clauses** enforce during their flow only.
- **Membership-keyed clauses** stand forever: they fire during org-targeted
  flows AND at the gate for existing members.

An obligation that must hold for members must be authored membership-keyed.
Example of the classic bug (this exact shape shipped in a draft):

```ts
// WRONG: fires at EVERY registration (any-of!), and never re-checks members
when: [{ intent: "registration" }, { membershipOrgType: ["company"] }]

// RIGHT: company-only, covers registration-into-company AND the gate
when: [{ membershipOrgType: ["company"] }]
```

Why it matters: rules added to the config after users exist must catch those
users at the gate. Intent-keyed rules silently don't.

## The identifiers MAP (leak-proof by construction)

Identifiers are a map `identifier → policy`, not a list of grant rules. In a
union-of-grants list, a `notWhen` on one rule can't claw back what another
rule granted — restrictions don't compose. As a unique key, each identifier's
visibility is decided in exactly one place.

## Resolvers

`resolveIdentifiers(config, ctx)` → visible identifier names.
`resolveFactors(config, ctx)` → factor specs (serialize with `factorKey`:
`password`, `otp:phone`, `link:email`, `totp`).
`resolveRequirements(config, ctx)` → bare requirement names.
`resolveObligations(config, ctx)` → typed obligations with the specifics a
screen needs (`identityTypes[]` — any listed type satisfies — /
`factorMethod` / `dataField` / `consent[]`).

## Validation

`validateAuthConfig` runs on config import (fails boot): factors offered at
authentication must be auth-capable, membership-required factors must be
gate-capable, OTP needs an OTP-capable `deliveredVia`, `deviceOtp` is
rejected (catalogued vocabulary without runtime support), every registrable
identifier must be code-deliverable or delegated (oidc) — an identity is born
by code proof or OIDC callback; anything else has no way to be born — and a
password factor must carry `config.minLength >= 8`, the provider's hard floor
(the DSL is the one authority on password acceptability; the provider's own
checks are pinned off in kratos.yml).
`validateOrgLifecycle` checks the org lifecycle entries (owner role present
for user-creatable types, no duplicates) — config that stays ready for the
org stage.
