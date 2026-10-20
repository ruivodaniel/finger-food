# Availability Resolvers — Examples

This folder contains **usage examples** that demonstrate UX patterns for handling availability.

The library provides data: `{ available: boolean, reasons: Reason[] }`

These examples show **application decisions**: what to render based on that data.

---

## UX Pattern Categories

| Pattern | When to Use | Example File |
|---------|-------------|--------------|
| **Hide** | Remove element entirely when unavailable | `pattern-hide-nav-item.tsx` |
| **Disable + Tooltip** | Keep button visible but disabled, explain why | `pattern-disable-with-tooltip.tsx` |
| **Loading State** | Show skeleton/spinner while data loads | `pattern-loading-state.tsx` |
| **Precondition** | Guide user to complete required step first | `pattern-precondition.tsx` |
| **State Conflict** | Explain why action blocked by entity state | `pattern-state-conflict.tsx` |
| **Multiple Conditions** | Combine several checks with multiple reasons | `pattern-multiple-conditions.tsx` |

---

## Key Principle

> The library does NOT encode UX policy. 
> These examples show one way to render — your app decides.

Choose patterns that fit your UX requirements:
- Navigation items → usually **hide** when unauthorized
- Action buttons → usually **disable with tooltip** when blocked  
- Forms → usually **disable submit + show validation errors**

---

## Common App-Level Patterns

### Categorizing Reasons for UI Rendering

The library gives you a flat array of reasons. If you need to render them by category (e.g., show validation errors separately from auth errors), that's your app's decision:

```typescript
// Example: Categorize reasons for UI rendering (app-level)
const byCode = (code: string) => reasons.filter(r => r.code === code);

const categories = {
  loading: byCode("in_progress"),
  validation: byCode("invalid_input"),
  authorization: byCode("not_authorized"),
  preconditions: byCode("precondition_missing"),
  conflicts: byCode("conflict"),
};

// Render each category differently
if (categories.validation.length > 0) {
  // Show inline field errors
}
if (categories.authorization.length > 0) {
  // Show permission tooltip
}
```

> **Why not in the library?** Different apps might categorize differently. One app might treat `quota_exceeded` as billing, another as conflict. The library provides data — you decide the UX.

---

## Setup Required

Before using these patterns, configure `fromScope` once at app initialization:

```typescript
// lib/availability.ts
import { createFromScope } from '@libs/availability-check';
import { scopedRoles } from '@prowd/common';

export const fromScope = createFromScope(scopedRoles);
```

Then import `fromScope` from your local setup, not from the library.

---

## Common Patterns

### Categorizing Reasons for UI Rendering

When showing categorized feedback (different colors for auth vs validation vs loading), filter reasons by code:

```typescript
// App-level helper — not in library (UX is your decision)
const byCode = (code: string) => reasons.filter((r) => r.code === code);

const categories = {
  loading: byCode("in_progress"),
  validation: byCode("invalid_input"),
  authorization: byCode("not_authorized"),
  preconditions: byCode("precondition_missing"),
  conflicts: byCode("conflict"),
};
```

### Using Real Session Data

The interactive examples use `useState` to simulate roles. In production:

```typescript
// DEV EXAMPLE (simulated):
const [selectedRoles, setSelectedRoles] = useState<string[]>(["view_own_org"]);

// PRODUCTION (from session):
const { memberRoles } = useOrganizationScoped();
```

