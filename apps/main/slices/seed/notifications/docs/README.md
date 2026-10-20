# notifications — docs

Product messages: the copy, who may silence it, and how it reaches a person.
The module owns the message types, the templates, the preference switchboard,
the delivery rows, and the in-app inbox. It owns no audience and no trigger —
recipients arrive explicitly in `to`, and something else decides when to call.

```
queue*(template, args, to, dedupeKey?)      ← app wiring, later a flow config
  └─ one tx: notification fact
             + one delivery row per recipient × channel
             + deliveryOutbox.enqueue(tx, pending email/sms)
  └─ after commit: deliveryOutbox.nudge()   ← fire-and-forget
deliverPending(deliveryId)                  ← the one send path
  └─ preference re-check → render → transport → sent | failed
```

## The two tables

`notification` is what happened — template, message type, args, written once
per queue call. `notification_delivery` is one row per recipient × channel and
carries the whole lifecycle: the preference verdict at queue time, attempts,
the send result, and the reader's own state.

| Status | Means |
| --- | --- |
| `pending` | email/SMS waiting for the outbox |
| `sent` | the transport accepted it |
| `delivered` | the provider confirmed it (webhook), or an in-app row at birth |
| `seen` / `dismissed` | the recipient read it / cleared it |
| `failed` | the transport returned an error, or there was no address |
| `suppressed_by_pref` | the recipient had opted out |
| `superseded` | an in-app row replaced by a newer one for the same dedupeKey |

Two partial-unique indexes carry semantics, not just hygiene:

- **supersede** — one ACTIVE in-app row per (recipient, template, dedupeKey).
  The queue marks the old row `superseded` BEFORE inserting, so the index
  accepts the new one and the inbox never shows the same thing twice.
- **idempotency** — one non-`failed` email/SMS row per (recipient, channel,
  template, dedupeKey). A retried queue call re-sends nothing; a row that hard
  failed doesn't block a later attempt.

In-app rows are born `delivered`: the committed row IS the delivery, so they
never ride the outbox. Copy renders at READ time for in-app (a wording fix
reaches rows already written) and at SEND time for email/SMS.

## Message types, templates, preferences

Three pieces, one story. The **message type** says whether users may opt out at
all; the **template** declares its type and its args; the module enforces the
result against `notification_preference` (user × type × channel).

```ts
// configs/notifications/types.ts
export const messageTypes = defineMessageTypes({
  system: { userPref: false },        // arrives whatever the user prefers
  organization: { userPref: true },   // silenceable per channel
});

// configs/notifications/templates/inapps/invitation-accepted.inapp.ts
export const invitationAcceptedInApp = defineInAppTemplate({
  name: "invitation_accepted",
  type: "organization",
  args: { accepterName: "string", orgName: "string", role: "string" },
  title: "Invitation accepted",
  body: "{{accepterName}} accepted your invitation to join {{orgName}} as {{role}}.",
});
```

`args` is a spec record (the catalog pattern — runtime object, type derived
from it, no zod in configs), so `QueueInput.args` is a compile check against
the copy. `validateTemplates` proves every placeholder is a declared arg, every
declared arg is used, the declared type exists, and no (channel, name) repeats.
It runs on config import AND at mount — a bad catalog fails boot loudly.

Absence of a preference row means **on**: users opt out, never in. Suppression
is visible, not silent — `QueueReceipt` returns `queued` and `suppressedByPref`
so a call that delivered nothing is distinguishable from one that delivered.

**Current-check at delivery, snapshot for audit.** The delivery row stores the
rule that applied at queue time; `deliverPending` re-reads the CURRENT rule
before sending. Someone who opts out in between gets `suppressed_by_pref` and
no message, while the snapshot still shows the old rule — the audit shows the
change rather than hiding it.

## Durable delivery

`DeliveryOutbox` is a mount port with two methods: `enqueue(tx, items)` runs
inside the queue's transaction (a rolled-back mutation enqueues nothing) and
`nudge(handles)` runs after commit and is fire-and-forget.

Omit it and the module uses `createInlineDeliveryOutbox` — delivery runs
in-process right after commit. That is the right default for tests and for
products without a worker. The seed wires the `workflow_intent` outbox here, so
a nudge lost to a crash is picked up by the reconciler.

Either way `deliverPending(deliveryId)` is the **single** send path, and it is
safe to call any number of times: every status write names the statuses it may
move from, so a double-claimed delivery moves nothing.

**Retry posture.** A transport failure lands the row on `failed` with
`attemptCount` incremented. A *fresh* attempt treats that as terminal — only
`pending` rows are deliverable, so nothing re-sends by accident. A *retried*
attempt passes `deliverPending(id, { retryFailed: true })` and may pick the
failed row back up, which is how the outbox's retry budget reaches the
transport. The seed's worker sets it from the intent's own attempt count: first
claim no, reclaimed claim yes.

## Transports

Ports on the module, drivers in the module, instances in each app:
`createSmtpEmailTransport`, `createTwilioSmsTransport`, `createSmsDevTransport`
are factories over **config, not env**, because two processes need the same
drivers. Failure is RETURNED (`{ ok: false, errorCode }`), never swallowed —
the queue has to know to mark the row `failed`. Unconfigured is a first-class
state: a warn-log no-op returning `not_configured`.

Identifier-addressed sends stay outside the queue by design. `Recipient.userId`
is required — it is what a delivery row records and what preferences key on —
so a message to someone without an account (an invitation, an auth code) is
rendered by wiring with `renderEmailTemplate` / `renderSmsTemplate` and handed
straight to a transport. The copy still lives in `configs/notifications/`.

## HTTP surface

Mounted inside the app's authenticated client router; the caller is always the
session's user and a row that isn't theirs is a 404, so no AC rules are needed.

| Route | Does |
| --- | --- |
| `GET /notifications` | cursor page of the caller's in-app rows + `unseenCount` |
| `POST /notifications/:deliveryId/seen` | mark read |
| `POST /notifications/:deliveryId/dismiss` | clear from the inbox |
| `GET /notification-preferences` | every type × channel, pinned ones read-only |
| `PUT /notification-preferences` | set one switch |

## Web surface

```tsx
<NotificationsProvider config={{ apiBaseUrl }} queryClient={qc} toast={toast}>
  …
  <NotificationBell />            {/* app shell, e.g. beside an org switcher */}
</NotificationsProvider>
```

| Export | Is |
| --- | --- |
| `NotificationBell` | bell + unread count + the center behind it |
| `NotificationCenter` | the popover panel, if an app wants it elsewhere |
| `useNotificationInbox` | items, `unseenCount`, `markSeen`, `dismiss` |
| `useNotificationPreferences` | the switch list + `setPreference` |
| `getNotificationsRoutes()` | the preferences page as a route definition |

Two rules the surface holds to:

- **No raw fetch in app code.** Everything goes through the module's client, so
  deleting the module breaks its consumers at compile time instead of leaving
  dangling URLs.
- **No session import.** The module never asks who is signed in; it reads the
  endpoint's answer. 401 (no session) and 428 (the app wants something from this
  caller first) both mean "show nothing", and polling stops — so the bell is
  quiet on a login screen and quiet behind a gate, without knowing what either
  is. It also renders nothing until the first read settles, because a badge that
  appears and vanishes reads as a bug.

The preferences page lists every type × channel and renders pinned rows
(`editable: false`) disabled rather than hidden — "you can't turn this off" is
information.

## Mounting

```ts
const notifications = mountNotificationsApi({
  db, createId,
  templates, messageTypes,        // from @configs/notifications
  transports: { email, sms },     // built from the module's factories
  deliveryOutbox,                 // optional — inline fallback otherwise
  errors, logger,
});
```

Back comes `{ router, services: { queue, delivery, inbox, preferences,
deliveryEvents } }`. The module's tables enter the app's migration chain by
re-export — `apps/api/src/models/index.ts` re-exports `./models`, and the app's
drizzle config generates from there. Table names are plain domain names, no
prefix.

## Layering

Only repositories touch tables. Services receive `runInTransaction`, built at
mount from the app's db handle, and never see the handle itself. Cross-domain
reads inside the module go through the owning service's narrow accessors —
the queue and the delivery path read preferences through
`PreferenceService.rulesFor` / `.ruleFor`, never through the preference repo.

## Not here yet

- **Flows.** App wiring pairs a module hook with a queue call by hand today.
  When `@prowd/flows` lands, those callbacks become `flowDispatcher.fire()` and
  the logic moves into `configs/notifications/flows/`. No module surface
  changes at that point — that is the acceptance test for this design.
- **Digest, push, and per-tenant switches.** Deferred; the status vocabulary
  and the preference table have room for them.
- **Suppress-on-revocation.** The archive had it; it needs scope columns on the
  delivery row. Revisit when membership revocation gets a consumer.

## Running the module's tests

```bash
pnpm --filter @prowd/notifications test:unit   # docker-free
```

In-memory repositories honor the two partial-unique indexes exactly, so the
queue's semantics (supersede, idempotency) are exercised without a database.
