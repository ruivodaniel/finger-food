# MAPR Documentation Standard

## Axioms

1. Each thing is documented in one canonical place, nothing is duplicated.
2. Documentation is positional: a doc lives at the scaffolding level it governs and applies to everything below it; navigation points to it.
3. Every doc follows the same structure, so a reader always knows where to look.
4. The structure runs axiom principles → purpose → reference detail. By reading the axiom principles you should understand the architecture principles and no reference should drift form axioms.
5. Documentation of reuseable domains (example: shared libs and modules) separates **consumer** (how to use) from **contributors** (how to change).

---

## Purpose

Agents write verbose, drifting prose by default, and no human can re-read every doc on every change. MAPR fixes the shape so the constraints are impossible to miss because every doc leads with its what and why before the how. 

---

## Reference

### Artifacts

MAPR stands for Map → Axioms → Purpose → Reference
Three artifacts, one job each.

| Artifact | Job | Structure |
|----------|-----|-----------|
| **Map** | Navigate — pointers only, never teaches | `INDEX.md` |
| **Doc** | Canonical reference | Axioms → Purpose → Reference |
| **ADR** | Record one past decision | Context → Decision → Consequences |

A map that teaches, a doc that records history, or an ADR in a canonical doc are all violations.

### Doc Structure

```
# Title

## Axioms
[numbered sentences — universal, one idea each, abstract → concrete, no bold, no prose]

## Purpose
[one paragraph — why these decisions exist]

## Reference
[detail, tables, diagrams, examples, canonical snippets]
```

- **Axioms** — plain sentences. One universal invariant per line, most abstract first, most concrete after. Easy to read, no long prose, no subjectiveness, no method names or shapes. If it's a mechanism, it's Reference, not an axiom.
- **Purpose** — one paragraph, plain dev voice. State why the decisions were made. Do not define universal concepts, do not restate the axioms. Someone reading axioms might understand the rules but purpose of those rules might not be self evident, that's the role of purpose.
- **Reference** — All concrete rules and mechanics that are relevant, still plain dev voice and with diagrams over prose.
- **Cross-cutting rationale** — stated once, in the constitution, and referenced. Never repeated per doc.

### Map Structure

```
# Context Name

> one-line description

## [Section]
| pointer | one-liner |
```

Central map (`docs/INDEX.md`) → domain entry points only.
Local map (`<context>/docs/INDEX.md`) → everything inside that context, nothing outside it.
Modular local map → points to `consumer/`, `contributor/`, `adr/`. Nothing else.

```
shared/modules/<name>/docs/
  INDEX.md       ← local map
  consumer/      ← usage docs (how to use)
  contributor/   ← internal docs (how to change)
  adr/           ← decisions

shared/libs/<name>/docs/
  INDEX.md       ← local map
  consumer/      ← usage docs
  contributor/   ← internal docs
  adr/           ← decisions
```

### ADR Structure

```
# YYYY-MM-DD — Short Title

## Context
## Decision
## Consequences
```

Files named `YYYY-MM-DD-short-title.md`, stored in `adr/` adjacent to the docs they concern.

### Map & ADR Locations

| Scope | Local map | ADR folder |
|-------|-----------|------------|
| Global | `docs/INDEX.md` | `docs/adr/` |
| Module | `shared/modules/<name>/docs/INDEX.md` | `shared/modules/<name>/docs/adr/` |
| Lib | `shared/libs/<name>/docs/INDEX.md` | `shared/libs/<name>/docs/adr/` |
| App | `apps/<name>/docs/INDEX.md` | `apps/<name>/docs/adr/` |
| App feature | `apps/<app>/features/<f>/docs/INDEX.md` | `apps/<app>/features/<f>/docs/adr/` |

### Maintenance Loop

```
- Draft Axioms, or the change needed
- Human approves
- Write from scratch, or scan Reference for gaps and clashes
- Report gaps and clashes to human
- Human approves resolution
- Update Reference
- Human approves reference
- update history → `adr/` if architectural change.
```

Order is fixed: axioms approved before reference, never the reverse.
