# Identifiers

## Login identifiers vs contact addresses

Two different things, deliberately kept apart:

- **Login identifiers** — what you can type to sign in. Security-sensitive:
  verified, credential-bearing, owned by the identity provider. **Capped.**
- **Contact addresses** — where the product reaches you. Unlimited, plain
  rows in the module's db (`user_contacts`: a `{ label, type, value }`
  payload + `isDefault`), no login power. The first login identifier seeds
  the DEFAULT contact at birth (once — contacts never sync with identifiers
  afterwards), and member lists show it. Contact management UI is a later
  stage.

## The slot model (and why a cap exists)

Kratos login identifiers must be discrete string traits declared in the
identity schema — an array of emails cannot be a credential identifier. So
"multiple emails" is modeled as fixed slots, every one a full first-class
login identifier (password + code login, verification, recovery):

| Type | Slots | Cap |
| --- | --- | --- |
| email | `email`, `email_2`, `email_3` | **3** |
| phone | `phone`, `phone_2` | **2** |

- Slot names are an **adapter detail** — the port speaks `{ type, value }`
  lists, the UI shows a list of addresses. Nothing outside
  `api/identity/kratos/` knows slots exist.
- One password, one TOTP enrollment, one AAL per account — because all slots
  live on ONE identity. (The rejected alternative — one identity per email —
  would fragment MFA and password state.)
- **Raising the cap is cheap**: adding another optional trait is a
  compatible schema change. Unlimited is impossible with Kratos identifier
  traits; genuinely unlimited addresses belong in contacts.

## Lifecycle

- **Add**: `port.addIdentifier(identityId, { type, value })` → first free
  slot; the address starts unverified; the caller then proves a code sent to
  it. Emails run the provider's verification flow; the provider's
  verification flow is email-only, so **phones prove possession via a code
  LOGIN** to the address (the same reroute recovery uses) — proving it marks
  the address verified and the incidental session is discarded. Re-adding
  your own unverified identifier just restarts verification (a resend).
- **Remove**: slots re-compact (no holes). The service guards two things:
  the identifier is on the CALLER's account, and the account keeps at least
  one login identifier (zero is unrecoverable — nothing can ever start a
  session again). Whether the REMAINING identifiers stay usable in every
  membership context is the gate's job, not removal's: dropping the last
  identifier a context accepts succeeds, and the gate answers the next
  request with an `identifier_present` obligation for the types that
  context accepts (any one satisfies it).
- **Uniqueness** is global across accounts (provider lookup by
  `credentials_identifier` covers every slot).
- **Verification state** rides on the provider's `verifiable_addresses` —
  the gate's `identifier_verified` obligation asks "does the caller have a
  verified address of this type", satisfied by any slot.

## Schema changes

The identity schema (`api/identity/kratos/infra/identity.schema.json`) is
immutable per `$id` in spirit: adding OPTIONAL traits is compatible (existing
identities still validate); renaming/removing/requiring traits needs a new
versioned `$id` plus an identity migration. Traits stay minimal (identifier
slots + `name`); everything else lives in module tables.
