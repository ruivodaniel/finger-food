# @libs/web-components

Shared UI components following the Content Modularity architecture.

---

## Component Hierarchy

```
Primitive (pure UI, no data awareness)
    ↓
Atom (field-level, data-aware)
    ├── Previewer (read-only)
    └── Editor (editable)
    ↓
Cell (entity-level, data-aware)
    ├── Content Cell (knowledge entities)
    └── Entity Cell (system entities)
    ↓
Wrapper (container + contextual interaction)
    ↓
Pattern (assembled layout)
```

### When to Use Each Level

| Level | Use When | Examples |
|-------|----------|----------|
| **Primitive** | Pure UI with no data awareness | Button, Input, Icon, Card |
| **Atom** | Displaying/editing a single field | VersionBadge, BranchSelector |
| **Cell** | Displaying/editing a complete entity | TermPreview, UserCard |
| **Wrapper** | Container that adds interaction to cells | RichTextWrapper, ListWrapper |
| **Pattern** | Assembled page section | KnowledgeHeader, SettingsPanel |

**Rule: Ask "what does the USER see?"**
- A field/property of something → **Atom**
- A complete thing → **Cell**
- A container holding things → **Wrapper**
- An assembled layout → **Pattern**

---

## Folder Structure

```
src/
├── index.ts
├── primitives/           # Base UI controls
│   ├── index.ts
│   └── icons/            # Theme-aware icons
├── atoms/                # Field-level components
│   ├── previewers/
│   └── editors/
├── cells/                # Entity-level components
│   ├── content/          # Content entities (Term, Note, etc.)
│   │   ├── previewers/
│   │   └── editors/
│   └── entity/           # System entities (User, Org, etc.)
│       ├── previewers/
│       └── editors/
├── wrappers/             # Containers (each gets own folder)
├── patterns/             # Assembled layouts
├── hooks/
├── lib/
└── shadcn/               # Base shadcn components (primitives)
```

---

## Theming Rules

**All components MUST be theme-agnostic.** Components never hardcode colors or styles.

### 1. Use CSS Variables (Not Hardcoded Colors)

```tsx
// ✅ CORRECT - uses CSS variables via Tailwind
<div className="bg-primary text-primary-foreground">

// ❌ WRONG - hardcoded color
<div className="bg-blue-500 text-white">
```

### 2. Use Semantic Tokens (Not Primitive Tokens)

```tsx
// ✅ CORRECT - semantic token
<div className="bg-muted text-muted-foreground">

// ❌ AVOID - primitive token (unless intentional)
<div className="bg-gray-100 text-gray-600">
```

### Available Semantic Tokens

| Token | Purpose |
|-------|---------|
| `background` / `foreground` | Page background and text |
| `primary` / `primary-foreground` | Primary actions |
| `secondary` / `secondary-foreground` | Secondary actions |
| `muted` / `muted-foreground` | Subtle backgrounds and text |
| `accent` / `accent-foreground` | Accented elements |
| `destructive` / `destructive-foreground` | Destructive actions |
| `card` / `card-foreground` | Card surfaces |
| `popover` / `popover-foreground` | Popover surfaces |
| `border` | Borders |
| `input` | Input borders |
| `ring` | Focus rings |

### 3. Use Component Token Classes

For structural properties that vary by theme, use component token classes:

```tsx
// ✅ CORRECT - uses component token class
<button className="btn-themed">Click me</button>
<div className="card-themed">...</div>

// Component tokens set: radius, shadow, padding, gap
```

### Available Component Token Classes

| Class | Properties Set |
|-------|----------------|
| `.btn-themed` | border-radius |
| `.btn-themed-shadow` | box-shadow |
| `.card-themed` | border-radius, box-shadow, padding, gap |
| `.list-themed` | gap |
| `.list-item-themed` | radius, shadow, padding, border |
| `.input-themed` | radius, padding, border-width |
| `.dialog-themed` | radius, shadow, padding |
| `.badge-themed` | radius, padding |
| `.table-themed th/td` | padding, border-width |
| `.tabs-list-themed` | gap |
| `.tabs-trigger-themed` | radius, padding |
| `.tooltip-themed` | radius, padding, shadow |
| `.alert-themed` | radius, padding |

### 4. Use Icon Component (Not Direct Imports)

```tsx
// ✅ CORRECT - uses Icon abstraction
import { Icon } from "@libs/web-components/primitives";
<Icon name="chevronRight" size="sm" />

// ❌ WRONG - direct lucide import
import { ChevronRight } from "lucide-react";
<ChevronRight className="h-4 w-4" />
```

### Icon Sizes

| Size | Class |
|------|-------|
| `xs` | `h-3 w-3` |
| `sm` | `h-4 w-4` |
| `md` | `h-5 w-5` |
| `lg` | `h-6 w-6` |
| `xl` | `h-8 w-8` |

### 5. Use Radius Variables

```tsx
// ✅ CORRECT - uses radius variable
<div className="rounded-lg">  // Uses --radius-lg

// ❌ WRONG - hardcoded radius
<div style={{ borderRadius: '12px' }}>
```

---

## Tailwind Classes

### Safe to Use

- All semantic color classes: `bg-primary`, `text-muted-foreground`, `border-border`
- All radius classes: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full`
- All shadow classes: `shadow-sm`, `shadow-md`, `shadow-lg`
- Layout utilities: `flex`, `grid`, `gap-*`, `p-*`, `m-*`
- Typography: `text-sm`, `font-medium`, `leading-tight`

### Avoid

- Hardcoded colors: `bg-blue-500`, `text-gray-700`, `border-slate-200`
- Hardcoded shadows with colors: `shadow-blue-500/50`
- Arbitrary values that should be tokens: `[border-radius:12px]`

---

## Dark Mode

Dark mode is handled automatically via CSS variables. No special handling needed.

The `data-theme="dark"` attribute on `<html>` triggers dark mode. All semantic tokens automatically adjust.

**Do NOT use:**
```tsx
// ❌ WRONG - manual dark mode classes
<div className="bg-white dark:bg-gray-900">
```

**DO use:**
```tsx
// ✅ CORRECT - semantic tokens handle dark mode
<div className="bg-background text-foreground">
```

---

## Example Component

```tsx
import { cn } from "@libs/web-components/lib/utils";
import { Icon } from "@libs/web-components/primitives";

interface ExampleCardProps {
  title: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

export function ExampleCard({ 
  title, 
  description, 
  onClick, 
  className 
}: ExampleCardProps) {
  return (
    <div
      className={cn(
        // Use semantic tokens
        "bg-card text-card-foreground",
        "border border-border",
        // Use component token class
        "card-themed",
        // Safe Tailwind utilities
        "flex flex-col",
        "hover:bg-accent/50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {/* Use Icon component */}
        <Icon name="file" size="md" className="text-muted-foreground" />
        <span className="font-medium">{title}</span>
      </div>
      
      {description && (
        <p className="text-sm text-muted-foreground mt-2">
          {description}
        </p>
      )}
    </div>
  );
}
```

---

## Checklist for New Components

Before submitting a component:

- [ ] Uses CSS variables for colors (not hardcoded)
- [ ] Uses semantic tokens where appropriate
- [ ] Uses `<Icon>` component (not direct lucide imports)
- [ ] Uses component token classes for structural properties
- [ ] No manual dark mode handling (`dark:` prefix)
- [ ] Follows naming conventions
- [ ] Placed in correct folder (primitive/atom/cell/wrapper/pattern)
- [ ] Exported from appropriate `index.ts`

---

## Related Documentation

- Component Cockpit: `/dev/cockpit`
- Theme Cockpit: `/dev/theme-test`
- Architecture: `COMPONENT-SCAFFOLDING-MIGRATION.md`
- Theming: `THEMING-ARCHITECTURE.md`
