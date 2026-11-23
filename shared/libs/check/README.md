# The check system

One check system for all of PROWD.

- **Three phases.** Seed: libs (code and data) and apps (code). Product design: data (screens, themes, artifacts). Product implementation: code.
- **The same in all three.** Entry points, a source that reaches the targets wherever they are stored, an expander, agnostic processors, and rules as data owned by location.
- **Rules.** Data. Rules and exceptions are written to the rule schema. The same for code and for data.
- **Processors.** A processor knows no rule. It knows how to check whether a rule is followed or violated, on code and on data, against the same rules, when applicable.

`check(entry points, crawl, follow, kinds, rule sets) → report`. The parts, in the order a run takes them: source, expander, parser, resolver, processor, exceptions, report (`schema.ts`).
The entry point to read first: the document "The UI rules check" (`shared/docs/db/doc/ui-rules-check.json`). The drawing: Frontend structure (`slice-design/projects/PROWD/slices/tool/explorations/concept-table`, latest version).

## To do

Not built. Parked on 19 Nov 2026.

- **The linter onto the system.** `scripts/lint` is a second runner today. Its rule sets become rule sets of this system, and its processors (import-export, structure, metrics and the others) become processors here: they stop reading files, the source does.
- **Run on a commit and in CI.** Today only a person runs the check.
- **The database source.** The only source is files. A source for rows: entry points by id or by tag, references between rows for follow.

Not started, to align first:

- **The `relation` processor.** Coverage across artifacts (every goal has a use case). It comes with product design.
