# PROWD UI Library

**What.** A theme engine + layout primitives + component library where visual identity is fully separated from structure.
**How.** Components and layouts declare what things ARE via `element="..."` / `layout="..."` attributes; the theme engine generates one CSS file that decides how they LOOK.
**Why.** Swapping one theme object changes the entire product's appearance — only works if exactly one thing owns visual CSS.

---

## For consumers — developers

| Doc | Read when |
|-----|-----------|
| [Markup Dictionary](consumer/developer/markup-dictionary.md) | All valid attributes, values, and rules |
| [Layouts](consumer/developer/layouts.md) | Page structure, layout components, compositions, ownership |
| [Naming](consumer/developer/naming.md) | How application components and their files are named: Subject + Role |

## For consumers — designers

| Doc | Read when |
|-----|-----------|
| [Theme Authoring](consumer/designer/theme-authoring.md) | Writing or modifying a theme object |

## For contributors

| Doc | Read when |
|-----|-----------|
| [Architecture](contributor/architecture.md) | System design — families, cascade, principles |
| [Engine](contributor/engine.md) | Theme engine — build pipeline, conventions, output |
| [Cascade Spec](contributor/cascade-spec.md) | CSS output — selectors, specificity, composition |

---

## Key locations

| What | Where |
|------|-------|
| Type definitions | `shared/libs/ui/types/` |
| Theme objects | `shared/libs/ui/themes/<theme>/v<n>/theme.ts` |
| Theme engine | `shared/libs/ui/web/theme-engine/` |
| Generated CSS | `shared/libs/ui/themes/<theme>/v<n>/generated/` (beside its source) |
| Components | `shared/libs/ui/web/components/` |
| Layouts | `shared/libs/ui/web/layouts/` |
| Sandbox | `shared/libs/ui/web/theme-engine/sandbox/` |
