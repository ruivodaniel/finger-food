# availability-check

**What.** A composable UI gate: takes a list of conditions (role-based, feature-flag, state-based) and returns `{ available, reasons }` for buttons, forms, and links.
**How.** Pure functions. Each condition contributes a reason; the result aggregates them. Components consume the verdict + props for disabled state and tooltip messaging.
**Why.** UI gating is a separate concern from backend authorization. Optimistic, fast, no round-trip — always paired with backend enforcement, never replacing it.

---

## For consumers

_Placeholder — to be expanded._ The current `01-CONCEPT.md` covers the model.

## For contributors

_Placeholder — to be expanded when the lib evolves._
