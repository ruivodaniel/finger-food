# @libs/availability-check

**Minimal utility for availability checks with unified reason handling.**

---

## What Is This?

A shared, cheap, predictable way to answer:

> "Is this available? If not, what are ALL the reasons?"

```typescript
import { resolveAvailability, fromBoolean } from '@libs/availability-check';
import { fromScope } from '@/lib/availability';  // Your configured adapter

const result = resolveAvailability([
  fromScope(memberRoles, ['manage_org']),
  fromBoolean(!isSaving, { code: 'in_progress', source: 'ui_state', params: { operation: 'saving' } }),
]);

// result = { available: false, reasons: [...] }
```

The library provides data. The application decides what to render.

---

## Installation

This is a workspace package. Add it to your app's dependencies:

```json
{
  "dependencies": {
    "@libs/availability-check": "workspace:*"
  }
}
```

---

## Quick Start

### 1. Setup fromScope (once, at app initialization)

```typescript
// lib/availability.ts
import { createFromScope } from '@libs/availability-check';
import { scopedRoles } from '@Prowd/common';

export const fromScope = createFromScope(scopedRoles);
```

### 2. Use in components

```typescript
import { resolveAvailability, fromBoolean, formatReasons } from '@libs/availability-check';
import { fromScope } from '@/lib/availability';

function EditButton({ memberRoles }) {
  const availability = resolveAvailability([
    fromScope(memberRoles, ['manage_org']),
  ]);

  if (!availability.available) {
    return (
      <Button disabled title={formatReasons(availability.reasons).join('. ')}>
        Edit
      </Button>
    );
  }

  return <Button onClick={handleEdit}>Edit</Button>;
}
```

---

## Core API

### resolveAvailability

Merge multiple inputs into one result.

```typescript
resolveAvailability(inputs: AvailabilityInput[]): AvailabilityResult

// Returns: { available: boolean, reasons: Reason[] }
```

### Adapters

| Adapter | Purpose |
|---------|---------|
| `createFromScope(scopedRoles)` | Factory for access control checks |
| `fromZod(zodError)` | Form validation errors |
| `fromBoolean(condition, reason)` | Any boolean condition |

### formatReasons

Convert reasons to human-readable strings.

```typescript
formatReasons(reasons: Reason[], dictionary?): string[]
```

---

## Design Principles

1. **Small and boring** — No clever abstractions
2. **Purely functional** — No React dependency in core
3. **Reasons are first-class** — Stable, minimal schema
4. **No UX policy** — Library provides data, app decides rendering
5. **Easy to adopt or ignore** — No lock-in

---

## Documentation

| Doc | Contents |
|-----|----------|
| [01-CONCEPT](./docs/01-CONCEPT.md) | Full architecture and examples |

---

## Types

```typescript
interface Reason {
  code: ReasonCode;      // 'not_authorized' | 'invalid_input' | ...
  source: ReasonSource;  // 'scope' | 'validation' | 'ui_state' | ...
  params?: Record<string, unknown>;
}

interface AvailabilityResult {
  available: boolean;
  reasons: Reason[];
}
```

---

## License

MIT


