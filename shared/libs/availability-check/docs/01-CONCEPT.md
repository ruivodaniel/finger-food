# Availability Resolvers — Concept

> **Status:** Discovery phase. Architecture-level discussion. No code yet.

---

## What Is This?

A **minimal utility library** that provides a shared, cheap, predictable way to answer:

> "Is this available? If not, what are ALL the reasons?"

It normalizes availability checks from multiple sources into a single output:

```
{ available: boolean, reasons: Reason[] }
```

That's it. The library doesn't render anything. It doesn't encode UX policy. It just provides data. The application decides what to do with it.

---

## Why Build This?

Without a shared pattern, teams reimplement the same micro-pattern everywhere:

1. Compute "can I do X?" (from scope, form state, loading state, etc.)
2. Decide: hide vs disable vs show placeholder
3. Attach tooltip or toast
4. Normalize reasons from different sources

This repetition creates:
- **Inconsistent UX** — Different components handle availability differently
- **Duplicated logic** — Same patterns written slightly differently each time
- **Scattered conditionals** — Hard to maintain, easy to miss edge cases

The library eliminates this by providing **one way to get availability + reasons**.

---

## Design Principles

### 1. Keep It Small and Boring

No clever abstractions. No magic. Just functions that take inputs and return outputs.

### 2. Purely Functional Core

The kernel has no React dependency. Works anywhere — components, hooks, utilities, tests.

```
resolveAvailability(inputs[]) → { available, reasons }
```

### 3. Reasons Are First-Class

A stable, minimal schema for reasons. Everything else is app-specific.

```typescript
interface Reason {
  code: ReasonCode;
  source: ReasonSource;
  params?: Record<string, unknown>;
}
```

### 4. No Encoded UX Policy

The library does NOT say:
- "Navigation items should be hidden"
- "Buttons should be disabled"
- "Tables should show placeholders"

These are **application decisions**. The library provides data. The app renders.

### 5. Easy to Adopt, Easy to Ignore

Developers can:
- Use the full pattern with adapters and helpers
- Use just the resolver function
- Use just the types for consistency
- Skip it entirely for simple cases

No lock-in. No framework. Just tools.

---

## The Core API

### The Kernel

One function that merges condition results:

```typescript
function resolveAvailability(inputs: AvailabilityInput[]): AvailabilityResult {
  const reasons: Reason[] = [];
  
  for (const input of inputs) {
    if (!input.available) {
      reasons.push(...input.reasons);
    }
  }
  
  return {
    available: reasons.length === 0,
    reasons,
  };
}
```

### Adapters (v0)

Transform different sources into the standard input format:

| Adapter | Source | Purpose |
|---------|--------|---------|
| `createFromScope(scopedRoles)` | @prowd/scoped-ac | Factory that returns configured adapter |
| `fromZod(zodError)` | Zod validation | Form validation errors |
| `fromBoolean(condition, reason)` | Any boolean | Simple conditions (loading, saving, etc.) |

### Formatter (Optional)

Convert reasons to human-readable strings:

```typescript
function formatReasons(reasons: Reason[], dictionary?: Dictionary): string[]
```

Uses i18n-compatible dictionary. Falls back to defaults.

---

## Reason Domains

Before defining codes, we identify the **domains of unavailability**:

| Domain | What It Means | Example |
|--------|---------------|---------|
| **Authorization** | User is not allowed (lacks role, scope, entitlement) | "Requires manage_org role" |
| **Availability** | Feature or resource is not enabled or provided | "Export not available in this plan" |
| **Validation** | Input is invalid or incomplete | "Email is required" |
| **Process State** | Something is currently happening, action blocked | "Saving in progress" |
| **Preconditions** | Something else must be done first | "Select an organization first" |
| **State Conflict** | Current entity state prevents action | "Cannot edit archived organization" |
| **Not Found** | Resource does not exist or not addressable | "This page does not exist" |
| **Quota/Rate** | Limited by plan, quota, or throttling | "Monthly limit reached" |
| **External Dependency** | Third party or integration is down | "Payment service unavailable" |

---

## Types

```typescript
// =============================================================================
// REASON CODES
// =============================================================================
// The (string & {}) pattern allows autocomplete for known codes while permitting custom codes.
// Codes describe the "shape" of the problem, NOT the UI action.

type ReasonCode =
  // Core set (must-have)
  | 'not_authorized'         // User lacks role, scope, or entitlement
  | 'not_available'          // Feature/resource not available in this context
  | 'invalid_input'          // Validation failed (form errors, Zod, etc.)
  | 'in_progress'            // Loading, saving, syncing, pending request
  | 'precondition_missing'   // Must do X first (setup, select org, connect integration)
  | 'conflict'               // State conflict: archived, locked, already exists, version mismatch
  
  // Extended set (optional, can fold into above if simpler)
  | 'not_found'              // Resource or route target doesn't exist
  | 'quota_exceeded'         // Plan limit, usage cap, rate limit
  | 'dependency_unavailable' // External system down or disconnected
  
  // App can add custom codes
  | (string & {});

// =============================================================================
// REASON SOURCES
// =============================================================================
// Where the reason originated (for debugging, filtering, styling)
// Keep this small. Implementation details (like "zod") are subsumed under categories.

type ReasonSource =
  | 'scope'                  // From access control (@prowd/scoped-ac)
  | 'validation'             // From form validation (Zod, etc. - implementation detail)
  | 'ui_state'               // From component state (loading, saving)
  | 'api'                    // From API response
  | 'business_rule'          // From business logic
  | (string & {});           // App can add custom sources

// =============================================================================
// THE REASON SCHEMA
// =============================================================================

interface Reason {
  code: ReasonCode;
  source: ReasonSource;
  params?: Record<string, unknown>;  // Context-specific data
}

// =============================================================================
// REASON KEY (for future dedupe/aggregation)
// =============================================================================
// A stable identifier for a reason. Not used in v0, but the concept is ready.

function getReasonKey(reason: Reason): string {
  // Example implementation: code:source:sortedParamsKeys
  const paramsKey = reason.params 
    ? Object.keys(reason.params).sort().join(',')
    : '';
  return `${reason.code}:${reason.source}:${paramsKey}`;
}

// =============================================================================
// INPUT/OUTPUT TYPES
// =============================================================================

interface AvailabilityInput {
  available: boolean;
  reasons: Reason[];
}

interface AvailabilityResult {
  available: boolean;
  reasons: Reason[];
}
```

### How "Still Loading" Fits

Use `in_progress` with params to distinguish operations:

```typescript
// Loading data
{ code: 'in_progress', source: 'ui_state', params: { operation: 'loading', target: 'memberships' } }

// Saving
{ code: 'in_progress', source: 'ui_state', params: { operation: 'saving' } }

// Syncing
{ code: 'in_progress', source: 'ui_state', params: { operation: 'syncing' } }
```

One code, different params. Keeps the code list small.

### Mapping Sources to Codes

| Source | Typical Codes |
|--------|---------------|
| `scope` | `not_authorized`, `quota_exceeded` (if entitlement-based) |
| `validation` | `invalid_input` |
| `ui_state` | `in_progress`, `precondition_missing` |
| `api` | Any code — `conflict`, `not_found`, `dependency_unavailable`, etc. |
| `business_rule` | `conflict`, `precondition_missing` |

---

## Adapter Details

### createFromScope — Access Control (Factory Pattern)

Creates a configured adapter that wraps `@prowd/scoped-ac`'s `checkAccess` function. **You configure once, use everywhere.**

#### How It Works

The scope library provides pure functions:

```typescript
// From @prowd/scoped-ac
import { checkAccess } from "@prowd/scoped-ac";

checkAccess(memberRoles, requiredRoles, scopedRoles) → AccessCheckResult

interface AccessCheckResult {
  allowed: boolean;
  reason?: string;         // Why denied (human-readable)
  matchedRole?: string;    // Which role granted access
  missingRoles?: string[]; // What roles would grant access
}
```

Our adapter wraps this into the `AvailabilityInput` format.

#### Setup (once, at app initialization)

```typescript
// lib/availability.ts
import { createFromScope } from '@prowd/availability-check';
import { scopedRoles } from '@Prowd/common';

// Create configured adapter
export const fromScope = createFromScope(scopedRoles);
```

#### Usage (many times, in components)

```typescript
import { fromScope } from '@/lib/availability';

// Clean API — no config passing
const input = fromScope(memberRoles, ['manage_org']);
```

#### Factory Signature

```typescript
function createFromScope(
  scopedRoles: ScopedRoleDefinitions
): (memberRoles: string[], requiredRoles: string[]) => AvailabilityInput
```

#### Internal Implementation (conceptual)

```typescript
import { checkAccess } from "@prowd/scoped-ac";

function createFromScope(scopedRoles: ScopedRoleDefinitions) {
  return (memberRoles: string[], requiredRoles: string[]): AvailabilityInput => {
    const result = checkAccess(memberRoles, requiredRoles, scopedRoles);
    
    if (result.allowed) {
      return { available: true, reasons: [] };
    }
    
    return {
      available: false,
      reasons: [{
        code: 'not_authorized',
        source: 'scope',
        params: {
          required: requiredRoles,
          missing: result.missingRoles ?? requiredRoles,
          reason: result.reason,
        },
      }],
    };
  };
}
```

#### Examples

**Check single role:**
```typescript
fromScope(memberRoles, ['manage_org'])
// If member has role: { available: true, reasons: [] }
// If not: { available: false, reasons: [{ code: 'not_authorized', source: 'scope', params: { required: ['manage_org'], missing: ['manage_org'], reason: "..." } }] }
```

**Check any of multiple roles:**
```typescript
fromScope(memberRoles, ['manage_org', 'owner'])
// Passes if member has ANY of these roles (matches checkAccess behavior)
```

**Use in resolveAvailability:**
```typescript
const result = resolveAvailability([
  fromScope(memberRoles, ['manage_org']),
  fromBoolean(!isSaving, { code: 'in_progress', source: 'ui_state', params: { operation: 'saving' } }),
]);
```

**Note:** This is synchronous. Uses data already in session. No API calls. The scope library's `checkAccess` handles role expansion (implies) internally.

---

### fromZod — Form Validation

Transforms Zod validation errors into availability input.

```typescript
function fromZod(error: ZodError | null | undefined): AvailabilityInput
```

**Returns:**
- If no error: `{ available: true, reasons: [] }`
- If error: One reason per field with `code: 'invalid_input'`, `source: 'validation'`

**Example:**
```typescript
const parseResult = schema.safeParse(formData);

const availability = fromZod(parseResult.success ? null : parseResult.error);
// { available: false, reasons: [
//   { code: 'invalid_input', source: 'validation', params: { field: 'email', message: 'Invalid email' } },
//   { code: 'invalid_input', source: 'validation', params: { field: 'name', message: 'Required' } }
// ]}
```

**Note:** Source is `'validation'`, not `'zod'`. Zod is an implementation detail.

---

### fromBoolean — Simple Conditions

For any boolean condition with a reason. The most flexible adapter.

```typescript
function fromBoolean(
  condition: boolean,
  reasonIfFalse: Reason
): AvailabilityInput
```

**Examples:**

**Loading state:**
```typescript
fromBoolean(!isLoading, { 
  code: 'in_progress', 
  source: 'ui_state', 
  params: { operation: 'loading' } 
})
```

**Saving state:**
```typescript
fromBoolean(!isSaving, { 
  code: 'in_progress', 
  source: 'ui_state', 
  params: { operation: 'saving' } 
})
```

**Precondition (org selected):**
```typescript
fromBoolean(!!activeOrgId, { 
  code: 'precondition_missing', 
  source: 'ui_state', 
  params: { missing: 'organization', message: 'Select an organization first' } 
})
```

**State conflict (archived):**
```typescript
fromBoolean(!org.isArchived, { 
  code: 'conflict', 
  source: 'business_rule', 
  params: { state: 'archived', message: 'Cannot edit archived organization' } 
})
```

---

## Important: Avoiding Duplicate Reasons

The library does **not** dedupe reasons automatically. If you add the same condition multiple times, you'll get duplicate reasons in the output.

**Your responsibility:** Keep your inputs clean. Don't add redundant conditions.

```typescript
// BAD: Duplicate conditions
resolveAvailability([
  fromScope(memberRoles, ['manage_org']),
  fromScope(memberRoles, ['manage_org']),  // Same check — duplicate reason
]);

// GOOD: Each condition once
resolveAvailability([
  fromScope(memberRoles, ['manage_org']),
  fromBoolean(!isSaving, { code: 'in_progress', source: 'ui_state', params: {} }),
]);
```

If dedupe becomes necessary in practice, it can be added in a future version.

---

## Usage Examples

> **Note:** These are **application usage examples**, not library components. The library provides `resolveAvailability`, adapters, and `formatReasons`. Everything else (how you render, what components you use, disabled vs hidden) is **application responsibility**.

### Example 1: Simple Access Check

```typescript
import { resolveAvailability } from '@prowd/availability-check';
import { fromScope } from '@/lib/availability';  // Pre-configured

const memberRoles = ['view_org'];  // From session

const result = resolveAvailability([
  fromScope(memberRoles, ['manage_org']),
]);

// result = { 
//   available: false, 
//   reasons: [{ code: 'not_authorized', source: 'scope', params: { required: ['manage_org'], missing: ['manage_org'] } }] 
// }

// Developer decides what to do:
if (!result.available) {
  // Hide the button? Disable it? Show tooltip? App decides.
}
```

### Example 2: Multiple Conditions (Access + Loading + Validation)

```typescript
const result = resolveAvailability([
  fromScope(memberRoles, ['manage_org']),
  fromBoolean(!isSaving, { code: 'in_progress', source: 'ui_state', params: { operation: 'saving' } }),
  fromZod(formErrors),
]);

// result.available = false if ANY condition fails
// result.reasons = ALL failing reasons (not just first)
```

### Example 3: With Formatted Messages

```typescript
import { formatReasons } from '@prowd/availability-check';

const result = resolveAvailability([...]);

if (!result.available) {
  const messages = formatReasons(result.reasons);
  // ['Not authorized. Requires: manage_org', 'Saving in progress']
  
  showToast({ title: 'Cannot submit', messages });
}
```

### Example 4: Edit Button with Disabled State

```typescript
function EditButton({ memberRoles }) {
  const availability = resolveAvailability([
    fromScope(memberRoles, ['manage_org']),
  ]);

  // Developer chose: disable with tooltip
  if (!availability.available) {
    return (
      <Button 
        disabled 
        title={formatReasons(availability.reasons).join('. ')}
      >
        Edit
      </Button>
    );
  }

  return <Button onClick={handleEdit}>Edit</Button>;
}
```

### Example 5: Navigation Filtering (Hide Unavailable)

```typescript
function Sidebar({ memberRoles, navItems }) {
  // Developer chose: hide unavailable items
  const visibleItems = navItems.filter(item => {
    const availability = resolveAvailability([
      fromScope(memberRoles, item.requiredRoles),
    ]);
    return availability.available;
  });

  return <NavList items={visibleItems} />;
}
```

### Example 6: Form Submit with Multiple Checks

```typescript
function SubmitButton({ memberRoles, form, isSaving }) {
  const availability = resolveAvailability([
    fromScope(memberRoles, ['manage_org']),
    fromBoolean(!isSaving, { code: 'in_progress', source: 'ui_state', params: { operation: 'saving' } }),
    fromZod(form.formState.errors ? new ZodError([]) : null),  // Simplified
  ]);

  return (
    <Button 
      disabled={!availability.available}
      title={!availability.available ? formatReasons(availability.reasons).join('. ') : undefined}
      onClick={handleSubmit}
    >
      {isSaving ? 'Saving...' : 'Save'}
    </Button>
  );
}
```

### Example 7: Precondition Check (Org Must Be Selected)

```typescript
function CreateButton({ activeOrgId, memberRoles }) {
  const availability = resolveAvailability([
    fromBoolean(!!activeOrgId, { 
      code: 'precondition_missing', 
      source: 'ui_state', 
      params: { missing: 'organization', message: 'Select an organization first' } 
    }),
    fromScope(memberRoles, ['manage_org']),
  ]);

  // ... render based on availability
}
```

### Example 8: State Conflict (Archived Entity)

```typescript
function EditOrgButton({ org, memberRoles }) {
  const availability = resolveAvailability([
    fromScope(memberRoles, ['manage_org']),
    fromBoolean(!org.isArchived, { 
      code: 'conflict', 
      source: 'business_rule', 
      params: { state: 'archived', message: 'Cannot edit archived organization' } 
    }),
  ]);

  // ... render based on availability
}
```

---

## What This Library Does NOT Do

| Does NOT | Why |
|----------|-----|
| Make API calls | Uses local data (session, scope library) |
| Enforce security | Security is API's job. This is UX. |
| Dictate rendering behavior | Developer configures per use case |
| Replace @prowd/scoped-ac | Works WITH scope library, wraps it |
| Handle business logic | Complex rules stay in API |
| Dedupe reasons | Keep your inputs clean |

---

## v0 Scope

What ships in the first version:

```
libs/availability-check/
├── docs/
│   ├── 01-CONCEPT.md              # This document
│   ├── 02-API-REFERENCE.md        # Detailed API docs
│   └── 03-PATTERNS.md             # Common usage patterns (examples, not policy)
├── examples/
│   ├── button-with-access.tsx     # Action button example
│   ├── navigation-filtering.tsx   # Sidebar filtering example
│   ├── form-validation.tsx        # Form with Zod example
│   ├── submit-multiple-checks.tsx # Multiple conditions example
│   └── precondition-check.tsx     # Precondition example
├── src/
│   ├── core/
│   │   ├── resolve.ts             # resolveAvailability()
│   │   └── types.ts               # Reason, AvailabilityResult, etc.
│   ├── adapters/
│   │   ├── from-scope.ts          # createFromScope()
│   │   ├── from-zod.ts            # fromZod()
│   │   └── from-boolean.ts        # fromBoolean()
│   ├── format/
│   │   └── format-reason.ts       # formatReasons()
│   └── index.ts                   # Public exports
├── package.json
├── tsconfig.json
└── README.md
```

**Not in v0:**
- React hooks (`useAvailability`)
- React wrapper components (`<Available>`)
- Automatic dedupe logic
- `fromApiMetadata` adapter (can add later if needed)

These can be added in future versions if needed.

---

## Future Considerations

If the pattern proves useful, future versions could add:

### fromApiMetadata Adapter (v1+)

When API includes availability metadata in response:

```typescript
function fromApiMetadata(availability: ApiAvailability | undefined): AvailabilityInput
```

### React Helpers (v1+)

```typescript
// Hook
function useAvailability(inputs: AvailabilityInput[]): AvailabilityResult

// Component (thin wrapper, no UX policy)
function Available({ inputs, children, whenUnavailable })
```

These would be optional and would NOT encode UX policy.

### Dedupe Logic (if needed)

```typescript
function dedupeReasons(reasons: Reason[]): Reason[]
// Dedupe by (code, source, stable params key subset)
```

### Additional Adapters

- `fromFeatureFlag(flag)` — for feature flag systems
- `fromPermission(permission)` — for BetterAuth permissions directly

---

## Integration Points

### With @prowd/scoped-ac

The scope library provides pure access control functions:

```typescript
// Scope library exports
import { checkAccess, explainAccess } from "@prowd/scoped-ac";

checkAccess(memberRoles, requiredRoles, scopedRoles) → AccessCheckResult
// Returns: { allowed, reason?, matchedRole?, missingRoles? }

explainAccess(memberRoles, requiredRoles, scopedRoles) → string
// Returns human-readable explanation
```

This library wraps `checkAccess` into the availability format:

```typescript
// Availability-resolvers adds (via factory)
const fromScope = createFromScope(scopedRoles);
fromScope(memberRoles, requiredRoles) → { available, reasons }
```

The adapter calls `checkAccess` internally and transforms the result.

### With Zod

Zod handles validation. This library transforms errors into availability format:

```typescript
// Zod (already used for forms)
schema.safeParse(data) → { success, error }

// This library transforms (source = 'validation', not 'zod')
fromZod(error) → { available, reasons: [{ code: 'invalid_input', source: 'validation', ... }] }
```

Zod is an implementation detail. The source is `'validation'` so you could swap Zod for another validator without changing reason handling.

---

## Open Questions

### Q1: Is the Reason Code List Complete?

Current core set:
- `not_authorized` — lacks role/scope
- `not_available` — feature not available
- `invalid_input` — validation failed
- `in_progress` — loading/saving/syncing
- `precondition_missing` — must do X first
- `conflict` — state prevents action

Extended set:
- `not_found` — resource doesn't exist
- `quota_exceeded` — plan/rate limit
- `dependency_unavailable` — external system down

Is this the right coverage? Are we missing common domains?

### Q2: i18n Integration

How does `formatReasons` integrate with existing i18n setup?

Current thinking: Accept dictionary parameter, fall back to English defaults.

### Q3: Package Name

Options:
- `@prowd/availability-check`
- `@prowd/availability`
- Something else?

---

## Summary

| Aspect | Answer |
|--------|--------|
| What is it? | Minimal utility for availability checks |
| Core output? | `{ available: boolean, reasons: Reason[] }` |
| Dependencies? | None. Pure TypeScript. |
| Lock-in? | None. Use what you want, skip what you don't. |
| UX policy? | None. Library provides data. App decides rendering. |
| v0 Adapters? | Scope (factory), Zod, Boolean |
| React? | Not in v0. Future consideration. |

