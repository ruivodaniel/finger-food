# @libs/realtime — Developer Implementation Brief

**Shared real-time transport engine for server→client push.**

---

## Why "realtime" and not "sse" or "websocket"

This library is named `realtime` because it is **transport-agnostic by design**. The current implementation uses SSE (Server-Sent Events), but the API contract is designed so that switching to WebSockets, long-polling, or any future transport requires **zero changes** in consuming code — modules and apps.

Modules never know or care how events are delivered. They call `push()` on the server and `useRealtimeChannel()` on the client. The transport is an implementation detail hidden inside this library.

If we ever need bidirectional streaming (e.g., collaborative editing), we swap the transport inside `@libs/realtime` — the `push()` function, the `useRealtimeChannel()` hook, and every module that uses them remain unchanged.

---

## THE GOLDEN RULE

> **One connection per user. Modules subscribe to channels. The library handles the rest.**

```typescript
// SERVER — Any module or app-level code pushes events
import { push } from "@libs/realtime/api";

await push(userId, {
  channel: "notifications",
  event: "new",
  data: { id: "n1", title: "You were invited", ... },
});

// CLIENT — Each module subscribes to its own channel
import { useRealtimeChannel } from "@libs/realtime/web";

const { lastEvent } = useRealtimeChannel("notifications");
```

No module opens its own connection. No module manages reconnection. No module knows about SSE.

---

## Architecture

```
shared/libs/realtime/
├── package.json
├── README.md                    (copy of this brief, expanded)
├── tsconfig.json
└── src/
    ├── index.ts                 (shared types only — both sides import this)
    ├── types.ts                 (core type definitions)
    ├── api/
    │   ├── index.ts             (server-side barrel export)
    │   ├── connection-manager.ts
    │   └── push.ts
    └── web/
        ├── index.ts             (client-side barrel export)
        ├── RealtimeProvider.tsx
        └── useRealtimeChannel.ts
```

### Three entry points (same pattern as `@modules/user-organization-mgmt`)

```json
{
  "exports": {
    ".":    "./src/index.ts",
    "./api": "./src/api/index.ts",
    "./web": "./src/web/index.ts"
  }
}
```

- `.` — Shared types (both server and client)
- `./api` — Server-side only (connection manager, push function)
- `./web` — Client-side only (React provider, hooks)

---

## Shared Types (`src/types.ts`)

```typescript
/**
 * A realtime event pushed from server to client.
 * This is the transport-agnostic contract.
 */
export interface RealtimeEvent<T = unknown> {
  /** Channel the event belongs to (e.g., "notifications", "conversations") */
  channel: string;
  /** Event name within the channel (e.g., "new", "updated", "deleted") */
  event: string;
  /** Event payload — module-specific data */
  data: T;
  /** Server-assigned timestamp (ISO string) */
  timestamp: string;
  /** Optional event ID for deduplication / resumption */
  id?: string;
}

/**
 * Options for the push function.
 */
export interface PushOptions {
  channel: string;
  event: string;
  data: unknown;
}

/**
 * Options for connecting to the realtime stream (client-side).
 */
export interface RealtimeConfig {
  /** Base URL of the API (e.g., "http://localhost:3000") */
  baseUrl: string;
  /** Path to the SSE endpoint (default: "/api/realtime/stream") */
  streamPath?: string;
  /** Auth headers or cookie-based — depends on app auth strategy */
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
}
```

---

## Server Side (`src/api/`)

### Connection Manager (`connection-manager.ts`)

Manages active SSE connections per user. When a user connects to the stream endpoint, their writable stream is registered. When `push()` is called, the manager writes to all active streams for that user (supports multiple tabs/devices).

```typescript
/**
 * In-memory connection registry.
 * Maps userId → Set of active writable streams.
 *
 * For single-process deployments (which is what the seed targets),
 * this is sufficient. For multi-process, this would be replaced with
 * Redis pub/sub or PostgreSQL LISTEN/NOTIFY — but the push() API
 * stays the same.
 */

export interface ConnectionManager {
  /** Register a new connection for a user */
  add(userId: string, stream: WritableStream): void;
  /** Remove a connection when it closes */
  remove(userId: string, stream: WritableStream): void;
  /** Get all active streams for a user */
  getStreams(userId: string): Set<WritableStream>;
  /** Check if a user has any active connections */
  isConnected(userId: string): boolean;
}

export function createConnectionManager(): ConnectionManager;
```

### Push Function (`push.ts`)

```typescript
import type { ConnectionManager } from "./connection-manager";
import type { PushOptions, RealtimeEvent } from "../types";

/**
 * Create a push function bound to a connection manager.
 *
 * Usage in app wiring:
 *   const manager = createConnectionManager();
 *   const push = createPush(manager);
 *
 *   // Later, in a service or hook:
 *   await push(userId, { channel: "notifications", event: "new", data: {...} });
 */
export function createPush(
  manager: ConnectionManager
): (userId: string, options: PushOptions) => Promise<void>;
```

### SSE Route Factory

The library should also export a factory to create the SSE endpoint (Hono route), so the app just mounts it:

```typescript
import type { ConnectionManager } from "./connection-manager";

/**
 * Creates a Hono route handler for the SSE stream endpoint.
 * The app mounts this at its chosen path (e.g., /api/realtime/stream).
 *
 * - Requires authenticated user (app applies auth middleware before this)
 * - Registers the connection in the manager
 * - Keeps the stream open until client disconnects
 * - Cleans up on disconnect
 *
 * Uses Hono's built-in streamSSE helper from "hono/streaming".
 */
export function createStreamRoute(manager: ConnectionManager): HonoHandler;
```

### Server-Side Barrel Export (`api/index.ts`)

```typescript
export { createConnectionManager } from "./connection-manager";
export type { ConnectionManager } from "./connection-manager";
export { createPush } from "./push";
export { createStreamRoute } from "./stream-route";
```

---

## Client Side (`src/web/`)

### RealtimeProvider (`RealtimeProvider.tsx`)

Single provider mounted once in the app root. Manages one EventSource connection per authenticated user. Distributes events to channel subscribers.

```typescript
import type { RealtimeConfig, RealtimeEvent } from "../types";

interface RealtimeProviderProps {
  config: RealtimeConfig;
  /** Whether the user is authenticated — only connect when true */
  enabled: boolean;
  children: React.ReactNode;
}

/**
 * Mounts once in the app root (alongside UserOrgMgmtProvider).
 * Opens a single SSE connection when enabled=true.
 * Automatically reconnects on disconnect (SSE native behavior).
 * Distributes incoming events to channel subscribers via context.
 */
export function RealtimeProvider(props: RealtimeProviderProps): JSX.Element;

/**
 * Internal context — not exported to consumers.
 * Consumers use useRealtimeChannel() instead.
 */
```

### useRealtimeChannel Hook (`useRealtimeChannel.ts`)

```typescript
import type { RealtimeEvent } from "../types";

interface UseRealtimeChannelResult<T = unknown> {
  /** The most recent event on this channel (null if none received yet) */
  lastEvent: RealtimeEvent<T> | null;
  /** Whether the SSE connection is currently open */
  connected: boolean;
}

/**
 * Subscribe to events on a specific channel.
 * Multiple components can subscribe to the same channel.
 * The hook only delivers events matching the given channel name.
 *
 * Usage:
 *   const { lastEvent, connected } = useRealtimeChannel<NotificationEvent>("notifications");
 *
 *   useEffect(() => {
 *     if (lastEvent?.event === "new") {
 *       // Handle new notification
 *     }
 *   }, [lastEvent]);
 */
export function useRealtimeChannel<T = unknown>(
  channel: string
): UseRealtimeChannelResult<T>;
```

### Client-Side Barrel Export (`web/index.ts`)

```typescript
export { RealtimeProvider } from "./RealtimeProvider";
export { useRealtimeChannel } from "./useRealtimeChannel";
```

---

## Package Configuration (`package.json`)

```json
{
  "name": "@libs/realtime",
  "version": "0.1.0",
  "type": "module",
  "description": "Transport-agnostic real-time push engine. One connection per user, channel-based event distribution.",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./api": "./src/api/index.ts",
    "./web": "./src/web/index.ts"
  },
  "peerDependencies": {
    "hono": ">=4.0.0",
    "react": ">=18.0.0"
  },
  "peerDependenciesMeta": {
    "hono": { "optional": true },
    "react": { "optional": true }
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "keywords": [
    "realtime",
    "sse",
    "server-sent-events",
    "push",
    "streaming"
  ],
  "license": "MIT"
}
```

---

## How Apps Wire It

### Backend (`apps/api/`)

```typescript
// apps/api/src/lib/realtime.ts
import { createConnectionManager, createPush } from "@libs/realtime/api";

export const realtimeManager = createConnectionManager();
export const push = createPush(realtimeManager);

// apps/api/src/routes/realtime.ts (or mounted in server.ts)
import { createStreamRoute } from "@libs/realtime/api";
import { realtimeManager } from "../lib/realtime";

// Mount with auth middleware applied before
app.get("/api/realtime/stream", authMiddleware, createStreamRoute(realtimeManager));
```

Then any service can push events:

```typescript
// apps/api/src/services/some-service.ts
import { push } from "../lib/realtime";

// After creating a notification in the database:
await push(userId, {
  channel: "notifications",
  event: "new",
  data: { id: notification.id, type: notification.type, title: notification.title },
});
```

### Frontend (`apps/web-main/`)

```typescript
// apps/web-main/src/routes/__root.tsx
import { RealtimeProvider } from "@libs/realtime/web";

function RootComponent() {
  const { session } = useSession(); // from BetterAuth

  return (
    <UserOrgMgmtProvider ...>
      <RealtimeProvider
        config={{ baseUrl: import.meta.env.VITE_API_URL }}
        enabled={!!session}
      >
        <Outlet />
      </RealtimeProvider>
    </UserOrgMgmtProvider>
  );
}
```

Then any module's components subscribe:

```typescript
// Inside notifications module's NotificationBell component
import { useRealtimeChannel } from "@libs/realtime/web";

const { lastEvent } = useRealtimeChannel("notifications");

useEffect(() => {
  if (lastEvent?.event === "new") {
    setUnreadCount((c) => c + 1);
    if (notificationType.invasiveness === "toast") {
      toast(lastEvent.data.title);
    }
  }
}, [lastEvent]);
```

---

## Why SSE (Current Transport)

| Concern | SSE | WebSocket |
|---------|-----|-----------|
| Direction needed | Server→client (notifications, updates) | Bidirectional |
| Reconnection | Built into browser `EventSource` API | Manual implementation |
| Hono support | Native `streamSSE` helper, universal | Needs `@hono/node-ws`, platform-specific |
| Auth | Cookies/headers work normally | Auth is tricky (no custom headers on handshake) |
| Proxies/LBs | Standard HTTP, no upgrade needed | Needs special proxy config |

Client→server actions (mark as read, send message, etc.) are regular HTTP requests. The "real-time" part is always server→client push. SSE covers this perfectly.

---

## Future: Scaling Beyond Single Process

The current `ConnectionManager` is in-memory (Map of userId → streams). This works for single-process deployments, which is what the seed targets.

For multi-process scaling, two options — both hidden inside the library:

1. **PostgreSQL LISTEN/NOTIFY** — Use `pg_notify` when pushing. Each process listens and forwards to its local connections. No new infrastructure.

2. **Redis pub/sub** — Standard pattern for horizontally scaled real-time. Requires adding Redis.

In both cases, the `push()` and `useRealtimeChannel()` APIs remain identical. The scaling strategy is an internal implementation detail of `@libs/realtime`.

---

## Checklist for Implementation

- [ ] Create `shared/libs/realtime/` directory structure
- [ ] Add to `pnpm-workspace.yaml` (already covered by `shared/libs/*` glob)
- [ ] Implement `src/types.ts` — shared event types
- [ ] Implement `src/api/connection-manager.ts` — in-memory user→streams registry
- [ ] Implement `src/api/push.ts` — factory for push function
- [ ] Implement `src/api/stream-route.ts` — Hono SSE route factory using `streamSSE`
- [ ] Implement `src/web/RealtimeProvider.tsx` — single EventSource, event distribution
- [ ] Implement `src/web/useRealtimeChannel.ts` — channel subscription hook
- [ ] Wire in `apps/api/` — create manager, mount stream route
- [ ] Wire in `apps/web-main/` — add RealtimeProvider to root
- [ ] Test: push event on server → arrives on client via SSE → hook receives it
