# Organizations, memberships, invitations

Organizations are the module's own tables and services — the identity
provider knows nothing about them. Two configs drive every decision: the
auth config (membership-keyed standing rules, join-context identifier and
consent narrowing) and the org-lifecycle config (create/join policy per org
type). The module reads facts and config; it never stores a verdict.

## Tables

- **`organization`** — `id`, `type` (org-lifecycle vocabulary, opaque to the
  module), `name`, `logo`, `metadata`, timestamps.
- **`member`** — one row per `(organization, user)` holding `roles` as a
  `text[]` of scoped role names. The row maps 1:1 to the gate's
  `MembershipFacts { orgType, roles }` — no translation layer.
- **`invitation`** — addressed to exactly one identifier (`email` XOR `phone`,
  service-validated; no synthetic values), `roles`, a `status` enum
  (`pending | accepted | rejected | revoked`), `inviterId`, `invitedUserId`
  (set on accept), and `expiresAt` (stamped at create from the org type's
  `join.invitation.expiresInSeconds`, default 48h; expiry is computed, never
  a stored status).

## What the config gates (and where)

| Decision                         | Source                                                                                                                     | Enforced in                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Who may create org type X        | `creation.actor` (`developer` ⇒ never user-created)                                                                        | `OrganizationService.create`                    |
| At most one of a type            | `isSingleInstance`                                                                                                         | `OrganizationService.create`                    |
| Owner role on create             | `creation.ownership.membershipOwnerRole`                                                                                   | `OrganizationService.create`                    |
| Consent on create                | `creation.ownership.legalConsent` (recorded against the org type)                                                          | `OrganizationService.create`                    |
| Invitations allowed              | `join.invitation.allow`                                                                                                    | `InvitationService.create`                      |
| Invitation expiry window         | `join.invitation.expiresInSeconds` (default 172800 = 48h; stamped on `expiresAt` at create)                                | `InvitationService.create`                      |
| Identifier match on accept       | `join.invitation.strictEmailMatch` / `strictPhoneMatch` (strict ⇒ exact owned identifier; lax ⇒ any owned of that channel) | `InvitationService.accept`                      |
| Consent on join                  | `join.legalConsent` (recorded against the org type)                                                                        | `InvitationService.accept`                      |
| Invite channel allowed           | auth-config `identifiers` map for `{ orgAction: "join", membershipOrgType }` (an email-only org type can't be phone-invited) | `InvitationService.create`                    |
| Standing obligations for members | auth-config membership-keyed factor/profile/consent rules                                                                  | the gate                                        |
| Last-owner protection            | code (the entry's owner role can't be the last one removed)                                                                | `MembershipService.updateRoles` / `remove`      |

## Access control

WHO may perform an org action (beyond tenancy — being a member) is the
`@prowd/gated-scoped-ac` engine's job, and it is wired: services run the
write verdicts (`allowCreate`/`allowUpdate`) and repositories execute
engine-resolved scopes through the gated db —
`organization.create/read/update`, `member.list/role.update/remove`,
`invitation.create/list/revoke`. Permissions live in
`configs/access-control`. One known gap stays a service business rule:
**role-value escalation** — `member.role.update` and `invitation.create`
accept any role literal (the DSL has no cross-role comparison yet).

Web controls carry a separate marker — `AC(availability-check):
<entity>.<action>` — because visibility is not the engine's workstream:
controls render for everyone and the server enforces, until availability-check
narrows visibility and options from the same rules the engine enforces.

## Services

- **OrganizationService** — `create`, `getById`, `update`, `listForUser`.
- **MembershipService** — `findAllByOrgId`, `updateRoles`, `remove` (both with
  last-owner protection), `listMemberships` / `listMembershipRoles` (what the
  session resolves the caller's org-context from), and `setActiveOrganization`
  (validated against membership; the fact is per-user, in `user_state`).
- **InvitationService** — `create` (+ delivery), `listForOrgId`, `revoke`,
  `getPublicView` (masked, no auth), `findAllByUserIdentifiers`, `accept`,
  `reject`. Accept **auto-verifies** the invited address — possession was proven
  by delivery.

## Two org lists

- **`/organizations` (web) — the platform DIRECTORY**: every org as a
  managed table (name · type · status badge · search / type / status
  filters · pagination), with founding a new org from its header. Rows the
  caller belongs to carry an enter action (activate → the current-org
  page); foreign rows are read-only — cross-org drill-in arrives with the
  access-control engine's cross-org read design, never by weakening the
  active-org session model. The backing `GET /organizations` is engine
  row-scoped: callers see only the rows their permissions admit
  (`read_all_organizations_system` for the directory).
- **`/my/memberships` + `/my/invitations` (web)**: the caller's memberships —
  their role per org, LEAVE (self-removal; last-owner protected) — and their
  pending invitations (accept/decline), each on its own page. Reached from
  the shell's user menu, which badges the pending-invitation count on the
  invitations item.

## Members list

`GET /organizations/:orgId/members` is name-searchable and paginated
(`{ rows, total }`). Each row carries the member's profile name/image and
their DEFAULT CONTACT (`user_contacts` join — see
[identifiers.md](./identifiers.md)); no provider reads happen on the list
path. The web surface renders it as one card: search · a Members/Invitations
select · invite (sheet) · the table (name · contact · roles · edit) ·
pagination; editing opens a sheet (role select + type-to-confirm removal).

## HTTP surface

Two inputs, kept apart. The **target** is the org named in the URL —
`/organizations/:orgId`, always a real id; the API has no "current" (the web
surface's `/organizations/current/…` pages resolve it to the active org's id
before calling). The **context** is the caller's **active org** —
`session.activeOrganizationId`, the request's claim sent in the
`x-active-organization` header and honored only when it names one of the
caller's memberships; the scoped-AC bag and role set are built from it.
Access control resolves the target against the context: a manager acting in
org A reaches only A, and a system admin acting in the system org reads any
org's details and members (`read_all_organizations_system`,
`read_all_members_system` — read only; managing stays pinned to the active
org). Switching is a client-side
store write, no endpoint.

```
POST   /organizations                                  create
GET    /organizations                                  directory (paged; engine row-scoped)
GET    /organizations/types                            org types ({id,label}) off the lifecycle DSL
GET    /organizations/:orgId                           detail
PATCH  /organizations/:orgId                           update (name/logo/metadata — edited from the Organization info card; the logo is the public URL from POST /organizations/:orgId/logo-upload; create-time logo is deliberately not surfaced)
POST   /organizations/:orgId/logo-upload               presign the org's logo upload (server-derived key via the mount's storage port; active org only)
GET    /organizations/:orgId/members?search&page&pageSize   { rows, total }
PATCH  /organizations/:orgId/members/:userId           { roles }
DELETE /organizations/:orgId/members/:userId           remove (self-leave included)
POST   /organizations/:orgId/invitations               invite (+ deliver; active org only)
GET    /organizations/:orgId/invitations               list
POST   /organizations/:orgId/invitations/:iid/revoke   revoke
GET    /me/memberships                                  my orgs + roles
GET    /me/invitations                                  pending, matched to me
POST   /me/invitations/:id/accept                      { consents? }
POST   /me/invitations/:id/reject
GET    /invitations/:id                                 PUBLIC — masked view
```

Reads are row-scoped: an org the context can't read is a **404** on
`GET /organizations/:orgId` (not-a-member and not-an-org stay
indistinguishable), and a members or invitations list outside the context's
scope comes back **empty**. Writes with a row (update, member roles/removal,
revoke) are refused with **403** by the update/delete scope. Logo presign has
no write of its own, so it probes the same update scope
(`findRowsByIdWhereCanUpdate`). Invite has no row at all — a create — so its
rules carry a `payload` condition on the invitation being written
(`$requestBody.organizationId` is `$session.organization.id`): which org a
role may invite into is the access-control config's call, and today every
role may invite into its active org only. There is no server-side fallback: a
request with no valid header has no context, and no org-scoped permission
applies.

Which org a device acts in is the client's memory (the module's web surface
keeps last-used in localStorage and defaults to the first membership); the
server holds no active-org state at all. The web client sends the active org
as the header on EVERY request — it is the context, never the target — so
permissions come from the active org's roles only: while acting in A, a
member of B sees B only through A's grants (none, today) and switches to B to
work in it. A switch removes the org-scoped cached queries and remounts the
page (the host's account layout keys its slot on the active org).

The gate excludes `/me` and `/invitations/` so a gated user can still view and
accept invitations (accepting an org is exactly how one becomes gated — the
loop must not deadlock) and reach `/me/security` to resolve obligations.
`/organizations` and everything under it stay gated.

## Invitation delivery seam

The module never knows web paths. The app supplies transports:

```ts
invitationDelivery: {
  sendEmail: (to, payload) => …,   // payload: { invitationId, organizationName,
  sendSms:   (to, payload) => …,   //   orgTypeLabel, roles, inviterName, expiresAt }
}
```

The app composes its own accept URL from `invitationId`. Absent delivery,
invitations are still created (and acceptable via their capability URL); a
warning is logged.

This seam carries the invitation OUT to an address, because an invitee may have
no account yet. The reply travels the other way: accepting emits
`onInvitationAccepted` (see [architecture.md](./architecture.md#lifecycle-hooks--the-outbound-seam)),
which is where the inviter's "X accepted your invitation" comes from. Acceptance
is the moment worth announcing precisely because it proves the accepter has an
account — a notification can be addressed to a user rather than to a string.

## A newcomer joining an org

Accepting an invitation is always a **signed-in** action, so a newcomer takes one
path: open the invitation link → register (one screen) → return via their
intention → accept. The accept seats the membership, re-checks match strictness
against the identifiers they now own, records consent against the joined org
type, and auto-verifies the invited address (possession was proven by delivery).

The org type's `join.legalConsent` is collected ON the accept page: the public
view carries the items paired with their current documents (`joinConsent`),
and Accept stays disabled until every mandatory item with a published document
is checked — the server re-validates regardless (see [legal.md](./legal.md)).

Then the gate takes over: the moment the membership exists, the org type's
standing rules apply, and anything the org demands that the account doesn't carry
yet is collected at `/resolve`.

Founding an org is likewise a signed-in action — there is no register-and-create.
