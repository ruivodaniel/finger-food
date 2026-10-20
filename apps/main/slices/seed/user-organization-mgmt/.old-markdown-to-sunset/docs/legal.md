# Legal documents and consent

Consent has two halves: the CONFIGS say what must be consented to (the auth
config's `legalConsent` rules, the org-lifecycle's `creation.ownership.legalConsent`
and `join.legalConsent` blocks), and the DATABASE holds the documents being
consented to plus the append-only record of who accepted which version. The
module ships both halves: the consent surfaces and the authoring surface that
creates the documents.

## The consent-item flags — `shown` / `consent` / `mandatory`

Every consent item in a config is one of three states. The same table drives
the frontend renderer (`ConsentDecisionList`) and the backend enforcement
(`LegalService`):

| Item state | Frontend | Backend |
| --- | --- | --- |
| `shown: false` | never rendered (server projections drop it) | never validated, never recorded |
| `shown: true, consent: false` | informational row — linked title, no checkbox, never "(required)" | never mandatory, never recorded |
| `shown: true, consent: true` | checkbox; "(required)" iff mandatory AND a published document exists | `isMandatory` = `shown && consent && mandatory !== false`; mandatory + published + unaccepted → 400 |

**Unpublished ⇒ waived.** An item whose document has no published version is
never demanded — recording skips it, the gate treats it as met, and screens
show it without "(required)". A warning is logged so a missing seed is
visible; it must never brick a flow.

## Documents — scope, versions, draft → publish

One table, `legal_document`: `(type, orgTypeId, version)` unique.

- **Scope**: `orgTypeId = null` is the platform's document; an org type's
  documents carry its id. Scopes are independent — there is no fallback from
  an org-typed lookup to the platform document, and no override: obligations
  are additive per scope.
- **Draft**: a row with `publishedAt = null` is the scope's single editable
  draft (always the top version number). Saving upserts it in place.
- **Publish** stamps `publishedAt`; from then the row is immutable and IS the
  scope's current version. Editing again opens the next version as a new
  draft. "Current" = highest published version, drafts skipped.
- Content is **sanitized HTML** (`contentHtml`), the render source of record:
  client-submitted HTML passes `sanitizeLegalHtml`'s conservative allowlist
  before storage (no scripts, no handlers, `javascript:` neutralized, safe
  `rel` forced on links).

### The blast radius of publishing

`consentSatisfied` demands a consent record at the CURRENT published version.
Publishing therefore re-gates, on their next request, every caller the item's
rules bind — a platform document re-gates EVERYONE consent-bound (members
included), an org type's document re-gates that type's members. The
re-consent path below is how they get back in; it ships with the authoring
surface for exactly that reason.

## Where consent is collected

| Moment | Items | Recorded at | Context |
| --- | --- | --- | --- |
| Registration (verify step) | auth-config rules matching `{intent: registration}` | `orgTypeId null` | `registration` |
| Organization create | `creation.ownership.legalConsent` (creator-is-owner only) | the org type | `gate` |
| Invitation accept | `join.legalConsent` | the org type | `gate` |
| Re-consent at `/resolve` | whatever the gate reports unmet | the group's scope | `gate` |

The gate demands BOTH scopes: the registration-invariant lens checks the
PLATFORM documents for every signed-in caller (that's where registration
records consent, so a republished platform document re-gates everyone),
and the membership lens checks each org type's documents for its members.
The contexts still fold the caller's org types, so the `notWhen` carve-out
(system_admin break-glass) holds in both lenses.

## The re-consent path

`GET /legal/consent/pending` projects the caller's UNMET consent obligations,
grouped by scope and paired with their current documents
(`PendingConsentGroupView[]`; waived items dropped). `ResolvePage` renders it
as the `ReconsentCard` — one section per group, titles linking to the
document, one accept per group posting to `POST /legal/consent`. The
`legal_consent_granted` obligation hint routes to `/resolve`, so an embedded
`GateNotice` anywhere leads here.

Invitation accept collects its consent PRE-membership: the public view
(`GET /invitations/:id`) carries `joinConsent` (items + current documents), the
accept page renders the checkboxes, and Accept stays disabled until every
mandatory item with a live document is checked. The server re-validates on
`accept` regardless.

## HTTP surface

Consent surface — under `/legal/`, inside the gate's exclude prefix (this IS
the resolve surface; a 428-blocked caller must reach it):

```
GET  /legal/documents/current?type=&orgTypeId=   current published (404 if none)
GET  /legal/documents/:id                        one published version (drafts 404)
GET  /legal/consent/pending                      unmet consent, grouped by scope
POST /legal/consent                              record consent (context "gate")
```

Authoring surface — under `/legal-admin`, deliberately OUTSIDE the exclude
prefix, so it stays gate-visible: authoring is a privileged domain action and
a blocked author resolves at `/resolve` first. WHO may author is the
`@prowd/gated-scoped-ac` engine — every `/legal-admin` endpoint gates via
`manage_legal_document_platform` (verdicts on writes, resolved scopes on
reads; a denied caller gets 404/forbidden, never the published fallback):

```
GET  /legal-admin/catalog                        authorable (scope, type) pairs
GET  /legal-admin/documents?type=&orgTypeId=     every version, drafts included
GET  /legal-admin/documents/:id                  one version, draft visible
PUT  /legal-admin/documents/draft                upsert the scope's draft
POST /legal-admin/documents/:id/publish          publish a draft
```

Drafts never leak: the public by-id read 404s a draft exactly like a missing
document; draft-visible reads exist only on the scoped `/legal-admin` path.

## The authoring catalog

The admin UI's scope list is a server projection (the raw config never
reaches a client): the platform group is the union of consent types from
auth-config rules matching `{intent: "registration"}`; each org type's group
unions its membership-keyed rules with the lifecycle's creation/join consent
blocks; empty groups are dropped. Known limitation: a consent rule
conditioned on a membership ROLE isn't enumerable (there is no role catalog
server-side) — none exist in the product config.

## Web surface

- `/manage-legal-documents` (+ `/:documentType/:orgTypeKey` deep links) — the
  authoring page (catalog sidebar, title + rich-text editor, save draft /
  publish v{n}, inline preview, version history). Under the app's
  default-gated shell, mirroring the server.
- `/legal-documents?type=` (terms when absent; `?orgTypeId=` narrows,
  `?docId=` pins a version) — the public viewer rendering the stored HTML.
- The sidebar's "Legal documents" entry is visible to every signed-in user —
  controls stay visible and the server enforces, until availability checks
  gate it from the same rules that authorize the `/legal-admin` endpoints.
  No parallel role list lives in nav config.
