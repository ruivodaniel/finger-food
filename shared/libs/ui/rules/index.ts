// THE UI RULES, as data: the lists the rules of the UI rule set speak of. The rule set itself is rule-set.ts, in the shape of the check system (shared/libs/check);
// the kinds of item are kinds.ts, where its things are in files is finders.ts, and system.ts gives the check system what it needs. This index holds only what has no dependency on the check system,
// so the UI as data validator and the linter can read the lists.
export * from "./composition";
export * from "./exceptions";
export * from "./code";
export * from "./check";

/** the version of the UI rule set. It goes up when any rule changes. A report records the number it was made with. */
export const RULES_VERSION = 10;
