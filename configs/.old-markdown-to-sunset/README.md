# What's configurable in this product

Every `*.config.ts` and `*.ac.ts` file under `configs/` is an authoritative
source of truth for a specific configurable concern. Runtime code, type
definitions, and utilities belong in modules, not here.

## Access control

| Concern | File |
|---|---|
| Role hierarchy + owner flags | [access-control/role-hierarchy.config.ts](access-control/role-hierarchy.config.ts) |
| UI groups + role titles/descriptions | [access-control/role-ui.config.ts](access-control/role-ui.config.ts) |
| DSL subjects | [access-control/subjects.config.ts](access-control/subjects.config.ts) |
| Account-baseline rules (every user) | [access-control/rules/user-organization-mgmt/account-baseline.ac.ts](access-control/rules/user-organization-mgmt/account-baseline.ac.ts) |
| System-admin org-type rules | [access-control/rules/user-organization-mgmt/system-admin.ac.ts](access-control/rules/user-organization-mgmt/system-admin.ac.ts) |
| Platform-admin org-type rules | [access-control/rules/user-organization-mgmt/platform-admin.ac.ts](access-control/rules/user-organization-mgmt/platform-admin.ac.ts) |
| Ops-center org-type rules | [access-control/rules/user-organization-mgmt/ops-center.ac.ts](access-control/rules/user-organization-mgmt/ops-center.ac.ts) |
| Company org-type rules | [access-control/rules/user-organization-mgmt/company.ac.ts](access-control/rules/user-organization-mgmt/company.ac.ts) |

## Brand and identity

| Concern | File |
|---|---|
| App name, logo, colors, contact info | [brand/index.ts](brand/index.ts) |

## Internationalisation

| Concern | File |
|---|---|
| English translation strings | [i18n/en.json](i18n/en.json) |

## Libraries

| Concern | File |
|---|---|
| List-query pagination defaults | [libs/list-query/defaults.config.ts](libs/list-query/defaults.config.ts) |

## Product

| Concern | File |
|---|---|
| User preference fields (locale, timezone, currency, country) | [product/preferences.config.ts](product/preferences.config.ts) |

## Theme

| Concern | File |
|---|---|
| Active UI theme selection | [theme/index.ts](theme/index.ts) |

## User-organization management

| Concern | File |
|---|---|
| Platform auth config (org types, BA plugin wiring) | [user-organization-mgmt/auth/auth.config.ts](user-organization-mgmt/auth/auth.config.ts) |
| Default routes per org type | [user-organization-mgmt/auth/routing.config.ts](user-organization-mgmt/auth/routing.config.ts) |

---

### Not cataloged here

- `configs/product/preferences.validators.ts` — Zod validators derived from
  `preferences.config.ts`; runtime code slated for relocation to module
