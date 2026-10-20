# realtime

**What.** A transport-agnostic push engine for server-to-client events over SSE.
**How.** Exposes a connection manager + push primitive on the backend and a `RealtimeProvider` on the frontend. Modules fire typed events; the engine delivers them; consumers subscribe by event type.
**Why.** Push notifications, live updates, and presence signals are cross-cutting concerns. Abstracting transport keeps modules free of SSE/WebSocket plumbing and makes the channel swappable.

---

## For consumers

_Placeholder — expand as the lib is consumed._

## For contributors

_Placeholder — expand when the engine gains new transports or event semantics._
