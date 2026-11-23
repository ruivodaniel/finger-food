// ── THE UI RULE SET ──────────────────────────────────────────────
// The rules of the UI library, as data, in the shape of the check system (shared/libs/check). Found by where it is: this file's place makes its owner `lib/ui`.
// A rule names its processor and gives it its parameters. The names a rule speaks of are the lists beside it (composition.ts, markup.ts, code.ts).
// The shapes of what is stored as a row are data schemas, named by the rules of the schema processor (the theme: ../types/schema; the UI document: ../ui-data/v2).
import type { ContractParams, Rule, TreeParams } from "../../check/index.ts";
import { LIMITS, TESTID } from "../ui-data/v2/dictionary";
import { MAX_DEPTH } from "../ui-data/v2/expr";
import {
  CONTAINERS, CONTAINER_ALLOWED_CHILDREN, MUST_LIVE_IN_CONTENT, TABSLIST_NOT_IN, OVERLAYS_NOT_IN_CONTAINER, SHELL_ONLY, FORBIDDEN_PRIMITIVES,
  NO_PAD, STACKS, STACK_PLACING_PROPS, COMPOSITE_PRIMITIVES, SLOT_ALLOWED, FULL_BLEED_IN_CONTAINER,
  HEADERS, HEADER_ALLOWED_CHILDREN, FOOTERS, FOOTER_ALLOWED_CHILDREN,
} from "./composition";
import { ALLOWED_JSX_PACKAGES, ANCHOR_TAGS, BUTTON_TAGS, PROJECT_ALIASES, SHELL_CHILDREN } from "./code";
import { PRIMITIVES } from "./primitives";
import { EXCEPTIONS } from "./exceptions";
import { RULES_VERSION } from "./index";

export const version = RULES_VERSION;

/** the code of the library: a primitive, a knowledge component */
const LIBRARY_CODE: Record<string, string | true>[] = [{ kind: "code", primitive: true }, { kind: "code", knowledge: true }];
/** E1 to E7, on the rules they are exceptions to: in the library's code, where the code names one */
const libraryExceptions = EXCEPTIONS.map(({ id, name, allows, reason }) => ({ id, name, on: LIBRARY_CODE, note: allows, reason }));
/** each primitive, by its name: the HTML elements it writes, and the outside components it wraps */
const elementsOf = PRIMITIVES.filter((p) => p.elements.length).map((p) => ({ on: { primitive: p.primitive }, allows: p.elements, reason: `the ${p.primitive} primitive writes its own elements` }));
const outsideOf = PRIMITIVES.filter((p) => p.outside.length).map((p) => ({ on: { primitive: p.primitive }, allows: p.outside, reason: `the ${p.primitive} primitive wraps them` }));
/** what is not outside: the project's own code by its aliases, and the packages a page takes components from (code.ts) */
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const NOT_OUTSIDE = `^(?:${PROJECT_ALIASES.map(escape).join("|")})|^(?:${ALLOWED_JSX_PACKAGES.filter((p) => !PROJECT_ALIASES.some((a) => p.startsWith(a))).map(escape).join("|")})(?:/|$)`;

const list = (s: Iterable<string>) => [...s];
const without = (s: Iterable<string>, ...others: Iterable<string>[]) => { const no = new Set(others.flatMap(list)); return list(s).filter((x) => !no.has(x)); };
/** the composition rules are about components: an HTML element is neither a parent nor a child of them */
const component = { notTag: "raw" };
const containers = { in: list(CONTAINERS), ...component };
const alerts = ["Alert", "AlertTitle", "AlertDescription"];

const tree = (id: string, group: string, description: string, params: TreeParams, more: Partial<Rule> = {}): Rule => ({ id, processor: "tree", severity: "error", group, description, params, ...more });
const limit = (id: string, description: string, params: { measure: string; max: number; message: string }): Rule => ({ id, processor: "limit", severity: "error", group: "language", description, kinds: ["data"], params });
const name = (space: string, description: string, message: string, id = space): Rule => ({ id, processor: "reference", severity: "error", group: "language", description, kinds: ["data"], params: { space, message } });
const contract = (id: string, group: string, description: string, params: ContractParams): Rule => ({ id, processor: "contract", severity: "error", group, description, kinds: ["data"], params });
const given = (id: string, description: string, params: ContractParams): Rule => ({ id, processor: "contract", severity: "error", group: "markup", description, params });
/** the property a test id is written in: the web's, and React Native's */
const TEST_IDS = ["data-testid", "testID"];

export const rules: Rule[] = [
  // ── nobody writes an HTML element or an outside component; a primitive may, its own ──
  tree("no-html-element", "markup", "Nobody writes an HTML element. A primitive writes its own.",
    { check: "node", nodes: [{ node: { tag: "raw" }, message: "<{node}> is an HTML element" }] }, { exceptions: [...elementsOf, ...libraryExceptions] }),
  tree("no-outside-component", "markup", "Nobody writes a component from outside the library. A primitive wraps its own.",
    { check: "node", nodes: [{ node: { originNot: NOT_OUTSIDE }, message: "<{node}> is not a component of the library: it comes from {origin}" }] }, { exceptions: outsideOf }),
  // ── a component is given only what it declares: its own types say it, its axes among them. The same rule for code and for a UI document ──
  given("undeclared-property", "A component is given only the properties it declares.", { check: "declared", as: "component", facet: "props", message: '{name} declares no property "{passed}"', allow: ["key", "ref", "children"], allowPattern: "^(?:data-|aria-)" }),
  given("property-value", "A value a component is given is one its declaration takes.", { check: "value", as: "component", facet: "props", messages: {
    string: "{passed} is a string", number: "{passed} is a number", boolean: "{passed} is a boolean", enum: "{passed} is one of {values}", node: "{passed} is a template: one node, drawn per item" } }),
  given("undeclared-event", "A component hands up only the events it declares.", { check: "declared", as: "component", facet: "events", message: '{name} has no event "{passed}"' }),
  // ── a file may have its own components, never another of the library's ──
  { id: "no-second-component", processor: "contract", severity: "error", group: "markup", kinds: ["code"], description: "A file may define components of its own, never one with the name of a component of the library: there is one Button, one Header.",
    params: { check: "own-name", as: "component", message: "{name} is a component of the library: this file defines another with its name" } },
  // ── no class, no inline style: the same rules for code and for a UI document ──
  tree("no-inline-style", "markup", "An inline style declares custom properties only, each a value that only the render knows. Never a property: markup decides the arrangement, the theme the look.",
    { check: "node", nodes: [{ node: { hasPattern: "^style" }, message: "<{node}> has an inline style" }] }, { exceptions: libraryExceptions }),
  tree("no-class", "markup", "Markup writes no class: the look is the theme's, the arrangement is the library's. The library's own code is where the classes are.",
    { check: "node", nodes: [{ node: { has: ["className"] }, message: "<{node}> has a class" }] }, { notOn: LIBRARY_CODE }),

  // ── composition: the same rules for code and for a UI document ──
  tree("slot-forbidden-primitive", "composition", "Alert and EmptyState are not primitives: a Card with a concept.", { check: "child", pairs: [
    { parent: component, child: { in: list(FORBIDDEN_PRIMITIVES).filter((c) => alerts.includes(c)), ...component }, message: '<{child}> is not a primitive; use Card with concept="alert".' },
    { parent: component, child: { in: without(FORBIDDEN_PRIMITIVES, alerts), ...component }, message: '<{child}> is not a primitive; use Card with concept="empty-state".' },
  ] }),
  tree("slot-overlay-in-container", "composition", "An overlay is triggered from inside Content, never a child of a container.", { check: "child", pairs: [
    { parent: containers, child: { in: list(OVERLAYS_NOT_IN_CONTAINER), ...component }, message: "<{child}> is an overlay; trigger it from inside <Content>, not as a child of <{parent}>." },
  ] }),
  tree("slot-shell-in-container", "composition", "What belongs in a shell zone is never inside a container.", { check: "child", pairs: [
    { parent: containers, child: { in: without(SHELL_ONLY, OVERLAYS_NOT_IN_CONTAINER), ...component }, message: "<{child}> belongs in a shell zone, never inside <{parent}>." },
  ] }),
  tree("slot-must-be-in-content", "composition", "What must live in Content is not written straight in a container.", { check: "child", pairs: [
    { parent: containers, child: { in: without(MUST_LIVE_IN_CONTENT, OVERLAYS_NOT_IN_CONTAINER, SHELL_ONLY), ...component }, message: "<{child}> must live inside <Content>, not straight in <{parent}>." },
  ] }),
  tree("slot-not-allowed-in-container", "composition", "A container holds only its parts and what is allowed straight in it.", { check: "child", pairs: [
    { parent: containers, child: { notIn: [...list(CONTAINER_ALLOWED_CHILDREN), ...list(OVERLAYS_NOT_IN_CONTAINER), ...list(SHELL_ONLY), ...list(MUST_LIVE_IN_CONTENT)], notPattern: "^[A-Z][a-zA-Z]*(Header|Footer|Title)$", ...component }, message: "<{child}> is not a valid direct child of <{parent}>. Wrap it in <Content>." },
  ] }),
  tree("slot-tabslist-in-header", "composition", "The tabs of a container live in a Header, a second header that says the concept tabs: never straight in the container.", { check: "child", pairs: [
    { parent: { in: list(TABSLIST_NOT_IN), ...component }, child: { in: ["Tabs", "TabsList"], ...component }, message: "<{child}> lives in a <Header> of the container (a second header with the concept tabs), not straight in <{parent}>." },
  ] }),
  tree("slot-header-one-row", "composition", "A Header holds one Stack: a row with a left zone and a right zone.", { check: "child", pairs: [
    { parent: { in: list(HEADERS), ...component }, child: { notIn: list(HEADER_ALLOWED_CHILDREN), notPattern: "^__", ...component }, message: "<{child}> is written straight in <{parent}>: a header holds one Stack, a row with a left zone and a right zone." },
  ] }),
  tree("slot-header-tabs-concept", "composition", "The Header that holds the Tabs says the concept tabs.", { check: "child", report: "parent", pairs: [
    { parent: { in: list(HEADERS), lacks: ["concept"], ...component }, child: { in: ["Tabs"], ...component }, message: "<{parent}> holds <{child}> and says no concept: the header of the tabs says the concept tabs." },
    { parent: { in: list(HEADERS), value: { prop: "concept", notPattern: "^tabs$" }, ...component }, child: { in: ["Tabs"], ...component }, message: "<{parent}> holds <{child}> and says another concept: the header of the tabs says the concept tabs." },
    { parent: { in: list(HEADERS), value: { prop: "concept", pattern: "^tabs$" }, ...component }, child: { notIn: ["Tabs"], notPattern: "^__", ...component }, message: "<{parent}> says the concept tabs and holds <{child}>: it holds the Tabs only." },
  ] }),
  tree("slot-footer-one-row", "composition", "A Footer holds one Stack: a row, what backs out on the left, what goes forward on the right.", { check: "child", pairs: [
    { parent: { in: list(FOOTERS), ...component }, child: { notIn: list(FOOTER_ALLOWED_CHILDREN), notPattern: "^__", ...component }, message: "<{child}> is written straight in <{parent}>: a footer holds one Stack, a row with what backs out on the left and what goes forward on the right." },
  ] }),
  tree("slot-fullbleed-in-content", "composition", "What is full-bleed by default stands straight in the container, not inside Content.", { check: "child", pairs: [
    { parent: { in: ["Content"], ...component }, child: { in: list(FULL_BLEED_IN_CONTAINER), ...component }, message: "<{child}> is full-bleed by default; place it straight in the container, not inside <Content>." },
  ] }),
  tree("slot-forbidden-child", "composition", "A component that lists its children holds only those.", { check: "child", pairs:
    Object.entries(SLOT_ALLOWED).filter(([, allowed]) => allowed !== "*").map(([parent, allowed]) => (
      { parent: { in: [parent], ...component }, child: { notIn: list(allowed as Set<string>), notPattern: "^__", ...component }, message: "<{child}> is not allowed inside <{parent}>." })),
  }),
  tree("slot-stack-no-pad", "composition", "A Stack or a Grid writes no pad: the carrying slot owns the padding.", { check: "child", pairs: [
    { parent: component, child: { in: list(NO_PAD), has: ["pad"], ...component }, message: "<{child}> must not write pad=; the carrying slot owns the padding." },
  ] }),
  tree("slot-stack-single-child", "composition", "A Stack that holds a single child places something.", { check: "node", nodes: [
    { node: { in: list(STACKS), lacks: list(STACK_PLACING_PROPS), ...component }, weight: 1, message: "<{node}> holds a single child and places nothing" },
  ] }),
  tree("position-needs-arranging-parent", "composition", "A position says where a child stands in its parent: the parent is a Stack, a Grid, a part zone or a layout zone.", { check: "child", pairs: [
    { parent: { notIn: [...list(STACKS), "Grid", ...list(CONTAINERS), "Content", "Header", "Footer"], notPattern: "^(?:Shell|Page|Main)", ...component }, child: { has: ["position"] }, message: "<{child}> has a position inside <{parent}>, which does not arrange its children: put it in a Stack or a Grid." },
  ] }),
  tree("composite-primitive-holds-a-stack", "composition", "A primitive that is a composition (an icon, a label, a count) holds one Stack, and the Stack arranges what it holds.", { check: "child", pairs: [
    { parent: { in: list(COMPOSITE_PRIMITIVES), ...component }, child: { notIn: ["Stack"], notPattern: "^__" }, message: "<{child}> is written straight in <{parent}>: a composite primitive holds one Stack that arranges its content." },
  ] }),
  tree("no-anchor-button-nesting", "composition", "No interactive element inside an anchor, unless it carries asChild.", { check: "descendant", pairs: [
    { ancestor: { in: list(ANCHOR_TAGS) }, descendant: { in: list(BUTTON_TAGS), lacks: ["asChild"] }, message: "<{descendant}> inside <{ancestor}> ({ancestorAt}): an interactive element inside an anchor; use asChild" },
  ] }, { kinds: ["code"] }),
  tree("no-shell-bare-div", "composition", "A shell is written with Shell and Page of the layouts, not a div.", { check: "child", report: "parent", pairs: [
    { parent: { in: ["div"] }, child: { in: list(SHELL_CHILDREN) }, message: "<{parent}> holds <{child}>: a shell is written with Shell and Page of the layouts" },
  ] }, { kinds: ["code"] }),

  // ── a UI document: its grammar ──
  { id: "language", processor: "schema", severity: "error", group: "language", description: "A UI document follows its grammar: what a document, a node, a read and an action are made of.", kinds: ["data"], params: { schema: "ui-document" } },
  limit("limit-nodes", "A UI document has a limited number of nodes.", { measure: "nodes", max: LIMITS.nodes, message: "too many nodes: {value}, and a document has {max} at most" }),
  limit("limit-depth", "The tree of a UI document has a limited depth.", { measure: "depth", max: LIMITS.depth, message: "tree too deep" }),
  limit("limit-expression", "An expression has a limited depth.", { measure: "expression depth", max: MAX_DEPTH, message: "expression too deep" }),

  // ── a UI document: every name it uses is one it may use there ──
  name("operation", "An expression uses an operation of the language.", 'unknown operation "{name}"'),
  name("action", "An action is one of the language's.", 'unknown action type "{name}"'),
  name("scope", "A value an expression reads is in scope where it is read.", '"{name}" is not in scope here'),
  name("read", "A state of a read names a read of the document.", '"{name}" names no read of this document'),
  name("state", "A state an action sets is declared by the document.", 'state "{name}" is not declared'),
  name("emit", "An event a component emits is one it declares.", '"{name}" is not an event this component emits'),
  name("slot", "A Slot names a slot the document declares.", '"{name}" is not a slot this document declares'),
  name("position", "A position is one of the library's.", '"{name}" is not a position'),
  name("data contract", "A read that is not a request names a read of the project's catalog.", 'unknown data contract "{name}"', "data-contract"),
  name("catalog action", "An action that is not a request names an action of the project's catalog.", 'unknown action "{name}"', "catalog-action"),

  // ── a UI document: what it names exists, and what it wires and fills is what that declares ──
  contract("unknown-component", "language", "A node names a component of the library, a built-in, or a component the project hosts.", { check: "exists", as: "component", message: '"{name}" is not a library component, a built-in, or a component this project hosts' }),
  contract("unknown-document", "language", "A reference names a UI document that exists, at a version it has.", { check: "exists", as: "document", message: 'unknown component "{name}"', version: "{name} has no version {version}" }),
  contract("no-children", "language", "Only a component that holds content has children.", { check: "declared", as: "component", facet: "children", message: "{name} has no children" }),
  contract("document-argument", "language", "A reference passes only the parameters the document declares.", { check: "declared", as: "document", facet: "args", message: '{name} has no parameter "{passed}"' }),
  contract("document-event", "language", "A reference wires only the events the document emits.", { check: "declared", as: "document", facet: "events", message: '{name} does not emit "{passed}"' }),
  contract("document-slot", "language", "A reference fills only the slots the document declares.", { check: "declared", as: "document", facet: "slots", message: '{name} has no slot "{passed}"' }),

  // ── a UI document: the test id of what a test or a play addresses ──
  tree("test-id", "language", "A node a test or a play addresses carries a test id: {context}-{element}-{type}.", { check: "node", nodes: TEST_IDS.flatMap((id) => [
    { node: { tag: `interactable:${id}`, lacks: [id] }, message: `{node} is interactable: it needs a ${id}, {context}-{element}-{type}` },
    { node: { tag: `interactable:${id}`, value: { prop: id, dynamic: false, notPattern: `^[a-z0-9]+(-[a-z0-9]+)+-(?:${TESTID.types.join("|")})$` } }, message: `"{value}" is not {context}-{element}-{type} with a type of ${TESTID.types.join(", ")}` },
    { node: { tag: `interactable:${id}`, value: { prop: id, dynamic: true, notPattern: `^(?:[a-z0-9]+(?:-[a-z0-9]+)*-|\\{bind\\})\\|(?:.*\\|)?[^|]*-(?:${TESTID.types.join("|")})$` } }, message: `a dynamic ${id} starts with its kebab-case context (a literal, or a bound parameter) and ends with -{type}` },
  ]) }, { kinds: ["data"] }),
  ...TEST_IDS.map((id, i) => tree(i ? "test-id-unique-mobile" : "test-id-unique", "language", "No two nodes of a UI document carry the same test id.", { check: "unique", prop: id, node: { tag: `interactable:${id}` }, message: '"{value}" is used twice in this document' }, { kinds: ["data"] })),
  tree("event-as-property", "language", "An event is wired with `on`, never written as a property.", { check: "node", nodes: [{ node: { hasPattern: "^on[A-Z]" }, message: "an event is wired with on.<event>, not as a prop: {prop}" }] }, { kinds: ["data"] }),
  tree("stack-position", "language", "A Stack sizes with `size`: `position` is for every other surface.", { check: "node", nodes: [{ node: { in: list(STACKS), value: { prop: "position" } }, message: "a Stack sizes with `size`, not `position`: position is for every other surface" }] }, { kinds: ["data"] }),

  // ── versions: a thing is used at its latest version, or it is said ──
  { id: "pinned-version", processor: "version", severity: "warn", group: "versions", description: "A thing that uses another at a version that is not the latest is listed: a pin can be meant, and it is never silent.", params: { message: "{name} is used at v{version}; the latest is v{latest}", through: " (through {through})" } },

  // ── a theme: the shape of what is stored as a row ──
  { id: "theme", processor: "schema", severity: "error", group: "theme", description: "A theme says only what the theme schema allows, per element.", kinds: ["theme"], params: { schema: "theme" } },
];
/** the groups a caller can ask for by name */
export const GROUPS = ["markup", "composition", "language", "theme", "versions"] as const;
