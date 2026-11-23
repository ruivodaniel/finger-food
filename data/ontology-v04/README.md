# Ingredient forest V4 — conservative update

Open `explorer.html` locally. The separate standalone HTML contains the same catalogue and needs no server.

## What changed

- 2,258 ingredient identities and 13,320 component references: +8 ingredients and +39 components versus V3. Every ingredient has a separate single-ingredient base component reference.
- 130 accepted change-log entries (not 130 new ingredients), plus 12 explicitly deferred name decisions. Includes English aliases, source corrections and component-only grades.
- Wild garlic and onion grass show candidate identities instead of silently choosing one. `oniongrass` finds the same ambiguous name. Scientific names are searchable metadata.
- Parsley root is separate from leaf parsley; its previously misplaced AGROVOC source reference was moved.
- Flour, butter, cream, salt and sugar grades added in this pass are component references linked to existing ingredients where supported. These do not inflate the atomic-ingredient count.
- Cross-role search points from an ingredient search to a matching component when appropriate, including icing sugar and plain flour.

## Grain of salt

This is a working reference catalogue, not a complete or fully expert-validated culinary ontology. Most records are inherited from V3 and retain that status. V4 does not retrospectively validate every inherited identity, classification, alias or cultivar. The inherited forest still has uneven depth and some historical role choices need review.

Only selected cases from the recipe benchmark were accepted. Many names remain unresolved. The frozen comparison finds 174 additional English phrases across 3,322 recipe mentions; 6,785 phrases across 11,483 mentions still lack an exact lookup. These are lexical lookup figures, not unique ingredient counts or semantic coverage/recall. Shared common names can be findable yet ambiguous. No completeness percentage is asserted.

A component has partial or unknown composition unless its reference definition supports more. A single-ingredient base is complete by definition only: no supplier formulation or purity was verified. No negative ingredient/allergen claim follows from a missing edge. Quantities and operational units are not invented. There are no SKU or translation records.

## Files

- `data/catalogue.json`: explorer dataset, including review states and change log.
- `data/change-log.json` and `.csv`: accepted and deferred changes, reasons and provenance.
- `data/recipe-evidence.json`: selected factual recipe witnesses; original corpus is the separate recipe-coverage-benchmark package, unchanged.
- `data/benchmark-lookup-comparison.json`: fixed-method V3/V4 lookup comparison.
- `data/name-ambiguities.json`: shared-name alternatives.
- `data/ontology_term.json`, `ontology_mapping.json`, `ingredient.json`, `ingredient_source.json`: relational identity/ontology exports. Names/aliases live on ontology terms; composition is a distinct relationship.
- `data/component_reference*.json` and CSVs: staged component identities and positive ingredient edges.
- `ingredient-forest-v04.sqlite`: inspectable relational snapshot; not a live operational import.
- `schema/`: integration proposal and staging SQL. Requires company ownership, units and reconciliation before an operational import.
- `source-inputs/`: retained original source catalogue, not a claim that all source concepts are ingredients.
- `validation/`: data checks, inherited regression checks, UI smoke checks and build summary. UI tests execute the actual HTML/JS in a DOM mock; no visual browser inspection was performed. Passing checks establishes software/data invariants, not culinary completeness.
- `build/`: build scripts and UI source. Regenerating requires the unchanged V3 and recipe benchmark sibling outputs referenced by these scripts; their hashes are recorded in baseline provenance. This package is usable without rebuilding.

English aliases remain separate from future term translations and sentence localization. No live database or earlier deliverable was overwritten.
