# user-organization-mgmt — docs

Config-driven identity module: registration, authentication, and account
recovery described by a declarative auth DSL, executed over Ory Kratos.

The module holds no flow table and no session table. Credential conversations
are the provider's own flows, relayed; the session is the provider's token,
carried in an HttpOnly cookie. What the module owns is the part the provider has no
concept of: the product's rules (the DSL), the app's user row, consent and
profile records, organizations and memberships — and the GATE, which re-checks
on every request that a caller still carries what the config demands.

| Doc | What it covers |
| --- | --- |
| [architecture.md](./architecture.md) | Layers, the identity-provider port, session model, module boundaries |
| [auth-config-dsl.md](./auth-config-dsl.md) | The DSL: axes, condition semantics, resolvers, the authoring convention |
| [identifiers.md](./identifiers.md) | Login identifiers vs contacts, the slot model, caps, verification |
| [flows-and-gate.md](./flows-and-gate.md) | The relay (registration/login/recovery), and how the gate evaluates |
| [organizations.md](./organizations.md) | Orgs, memberships, invitations, the active org |
| [legal.md](./legal.md) | Legal documents: authoring (draft → publish), consent flags, re-consent |
| [web-surface.md](./web-surface.md) | Pages, the api client, what the config drives |

## Stage map

- **Stage 1** — auth core: the DSL engine, Kratos infra + adapter,
  models/repositories/services, HTTP surface + mount, web-main cutover.
- **Stage 2 (this stage)** — organizations, memberships, invitations, and the
  gate going live on the module's own membership facts (active organization,
  signed-in invitation accept). See [organizations.md](./organizations.md).
- **Stage 3 (landed)** — access control (`@prowd/gated-scoped-ac`: who may
  perform each org action — verdicts on writes, engine-resolved row scopes on
  reads; role-value escalation stays a service business rule until the DSL
  can compare roles).
- **Later** — social login, contacts management UI.

## Runtime support matrix

Two layers: the DSL can *express* a policy; the runtime must *do* it. This is
what's actually wired.

| Capability | Status |
| --- | --- |
| Email registration (code birth + password set at birth) | ✅ |
| Phone registration (code — identity born at verify) | ✅ |
| Password login | ✅ |
| Phone / email OTP login | ✅ (email offers password OR a mailed sign-in code) |
| Email + phone recovery (code → new password → revoke all) | ✅ |
| Identifier verification | ✅ |
| Multi-identifier management (3 email / 2 phone) | ✅ |
| Consent + profile obligations at registration | ✅ |
| Legal-document authoring (draft → publish, platform + org-type scopes) | ✅ (`/manage-legal-documents`; authoring gated by `manage_legal_document_platform`) |
| Re-consent at `/resolve` (pending-consent projection) | ✅ |
| Consent on invitation accept (`join.legalConsent`) | ✅ |
| Public legal-document viewer | ✅ (`/legal-documents?type=`, `?docId=` pins a version) |
| Live gate evaluation (facts, not verdicts) | ✅ |
| Organizations (create/read/update, config-gated) | ✅ |
| Organizations directory (all orgs, search/filter/paged) | ✅ (engine row-scoped — `read_all_organizations_system`) |
| Memberships + member management (roles, last-owner protection) | ✅ (paged member table w/ default contact; leave-self at `/my/memberships`) |
| Contact addresses (`user_contacts`) | ✅ default seeded at birth from the first identifier; management UI later |
| Avatar & org-logo upload (presigned, server-derived keys) | ✅ via the mount's `storage` port (`@prowd/storage` in the seed) |
| Preferences (language, timezone — follow-system or explicit; currency, country — a pick, when the product lets users override them) | ✅ `GET/PATCH /me/preferences` + `/my/settings/preferences`; the product's policy is injected (mount `preferences`, web config `preferences`), own-row gated by `manage_own_preferences` |
| Invitations (invite/accept/reject/revoke, email+SMS, match strictness) | ✅ |
| Register-and-join (an invitation carries a newcomer through registration) | ✅ |
| Active organization per request (`x-active-organization` header, org switcher) | ✅ |
| Standing gate obligations by membership | ✅ (live — membership facts from the module's own `member` rows) |
| **Opt-in TOTP 2FA + backup codes** | ✅ (enroll on `/my/settings/security` or in the `/resolve` wizard; enforced at login when enrolled) |
| Logout | ✅ |
| Sign out of all other devices | ✅ (`/my/settings/security`; provider sessions + module contexts, caller's survives) |
| Social login (google/apple OIDC) | ⏳ dormant — port/session shape ready, no UI/creds |
| True clickable magic link | ⏳ codes only — click-to-verify designed, not built |
| Access control — who may perform each org action | ✅ `@prowd/gated-scoped-ac` (verdicts + resolved scopes at every marked site; config in `configs/access-control`) |
| `deviceOtp` | ✋ rejected by `validateAuthConfig` (no runtime) |

## How the app runs this module

The host app mounts per `api/mount-types.ts` (see `apps/api/src/mounts.ts`):
authMount at its basePath (`/api/auth`), session + gate middlewares on the
client surface (`/api/client`). The provider's courier SMS callback rides the
module's own auth surface (`/api/auth/courier/sms`, secret-guarded, registered
before the session middleware) — the app never mounts or names it, and the
module-shipped `kratos.yml` is the only place that knows the URL.
The module's tables enter the app's migration chain
by re-export — `apps/api/src/models/index.ts` re-exports `./models`, and the
app's drizzle config generates migrations from there. Table names are plain
domain names, no prefix (`user`, `organization`, `member`, …; `user` is a
Postgres reserved word, quoted by drizzle everywhere). Rate limiters attach on
`authMount.rateLimitPaths` when the app grows them.

## Running the module's tests

```bash
pnpm --filter @prowd/user-organization-mgmt test:unit      # docker-free
pnpm --filter @prowd/user-organization-mgmt test:contract  # needs: docker compose up -d postgres kratos maildev (in apps/api)
```
