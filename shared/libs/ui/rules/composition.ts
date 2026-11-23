// ── COMPOSITION ──────────────────────────────────────────────────
// What may stand inside what: the slot rules, as data. One place: the linter (code) and the UI as data validator (documents) both read this file.
// Brought as it was from scripts/lint/slot-rules-data.ts, which now only hands this file on.

export const CONTAINERS = ["Card", "SheetContent", "DialogContent", "PopoverContent", "AlertDialogContent"] as const;

// R1. Direct children of a container may be only these primitives.
export const CONTAINER_ALLOWED_CHILDREN = new Set([
  "Header", "Content", "Footer", "Separator",
  "Tabs", "TabsList", "Accordion",
  "Table", "TreeView", "RemoteImage",
  // what scrolls inside a container: only a ScrollArea scrolls, so a table that scrolls stands in one
  "ScrollArea", "VirtualScrollArea",
  // a React context is not an element: it arranges and draws nothing
  "Provider",
]);

// R2-R6. Primitives that must sit INSIDE Content (never straight in a container).
// Matched negatively: anything NOT in CONTAINER_ALLOWED_CHILDREN and NOT a composite (upper + Header/Footer)
// is an R2 violation, unless it is also listed below as a known-forbidden primitive.
export const MUST_LIVE_IN_CONTENT = new Set([
  "Tile",
  // a list stands inside the content, in from the container's edges (ruled 22 Nov); a table fills the container
  "List",
  "Stack", "Grid",
  "Text", "Label", "Icon", "Svg",
  "Button", "IconButton", "Chip", "Toggle",
  "Input", "Textarea", "Select", "InputSelect", "Combobox", "MultiSelect", "PhoneInput", "AddressAutocomplete", "OTP", "FileUpload", "DatePicker", "ColorPicker", "IconPicker",
  "Checkbox", "Radio", "Switch", "ChoiceGroup",
  "ButtonGroup", "TabBar", "Breadcrumb", "Pagination",
  "Badge", "Avatar", "Progress", "Spinner", "Skeleton",
]);

// R4. The tabs of a container live in a Header (a second header that says the concept `tabs`), never straight in the container (ruled 22 Nov).
export const TABSLIST_NOT_IN = new Set<string>(CONTAINERS);
export const TABS = new Set(["Tabs", "TabsList"]);

// R4b. A Header holds one Stack: a row with a left zone and a right zone. The second header that says the concept `tabs` holds the Tabs (ruled 22 Nov).
export const HEADERS = new Set(["Header", "SheetHeader"]);
export const HEADER_ALLOWED_CHILDREN = new Set(["Stack", "Tabs"]);
// R4c. A Footer holds one Stack: a row, what backs out on the left, what goes forward on the right (ruled 22 Nov).
export const FOOTERS = new Set(["Footer"]);
export const FOOTER_ALLOWED_CHILDREN = new Set(["Stack"]);

// R5. Overlays are never a direct child of a container; they are triggered from inside Content.
export const OVERLAYS_NOT_IN_CONTAINER = new Set([
  "DropdownMenu", "Menu", "HoverCard", "Tooltip",
]);

// R6. Sidebar family is a shell-zone citizen, never inside a container.
export const SHELL_ONLY = new Set(["Sidebar", "SidebarItem", "NavItem"]);

// R7. Alert/EmptyState are not primitives: must be a Card wearing a concept.
export const FORBIDDEN_PRIMITIVES = new Set(["Alert", "EmptyState", "AlertTitle", "AlertDescription"]);

// R8. Stack/Grid never writes `pad`.
export const NO_PAD = new Set(["Stack", "Grid"]);

// R9. A Stack with a single child must place or size it. It is flagged only when it does nothing: none of justify, align, size, className, position
// (a lone Stack that centers a button or sizes a table is legal; a lone Stack with only dir / gap / wrap / data-testid is a do-nothing wrapper).
export const STACKS = new Set(["Stack"]);

// A primitive that is itself a composition of an icon, a label, a count: it holds one Stack that arranges what it holds.
export const COMPOSITE_PRIMITIVES = new Set(["SidebarMenuButton", "SidebarMenuSubButton"]);
export const STACK_PLACING_PROPS = new Set(["justify", "align", "size", "className", "position"]);

// R10-R17. Slot → allowed children. The key is the slot name; the value is the whitelist (or "*" for anything).

// R-flip. Table, List, RemoteImage are always full-bleed by default: straight in the container.
// Putting them inside Content is a violation (an explicit exception is acceptable only when
// the Content padding must frame them, which is rare).
export const FULL_BLEED_IN_CONTAINER = new Set(["Table", "RemoteImage"]);

export const SLOT_ALLOWED: Record<string, Set<string> | "*"> = {
  TabsList: new Set(["TabsTrigger"]),
  Accordion: new Set(["AccordionItem"]),
};

export type SlotViolation = {
  id: "slot-not-allowed-in-container" | "slot-must-be-in-content" | "slot-forbidden-child" | "slot-stack-no-pad" | "slot-tabslist-in-header" | "slot-overlay-in-container" | "slot-shell-in-container" | "slot-forbidden-primitive" | "slot-stack-single-child";
  node: string;
  parent?: string;
  message: string;
};

/** one parent and one child against the rules. `childHasPad`: the child writes `pad` */
export function checkPair(parent: string, child: string, childHasPad: boolean): { id: SlotViolation["id"] | "slot-fullbleed-in-content"; message: string }[] {
  const out: { id: SlotViolation["id"] | "slot-fullbleed-in-content"; message: string }[] = [];
  if (FORBIDDEN_PRIMITIVES.has(child)) {
    const concept = child === "Alert" || child === "AlertTitle" || child === "AlertDescription" ? "alert" : "empty-state";
    out.push({ id: "slot-forbidden-primitive", message: `<${child}> is not a primitive; use Card with concept="${concept}".` });
  }
  if ((CONTAINERS as readonly string[]).includes(parent)) {
    if (OVERLAYS_NOT_IN_CONTAINER.has(child)) out.push({ id: "slot-overlay-in-container", message: `<${child}> is an overlay; trigger it from inside <Content>, not as a child of <${parent}>.` });
    else if (SHELL_ONLY.has(child)) out.push({ id: "slot-shell-in-container", message: `<${child}> belongs in a shell zone, never inside <${parent}>.` });
    else if (MUST_LIVE_IN_CONTENT.has(child)) out.push({ id: "slot-must-be-in-content", message: `<${child}> must live inside <Content>, not straight in <${parent}>.` });
    else if (!CONTAINER_ALLOWED_CHILDREN.has(child) && !/^[A-Z][a-zA-Z]*(Header|Footer|Title)$/.test(child)) out.push({ id: "slot-not-allowed-in-container", message: `<${child}> is not a valid direct child of <${parent}>. Wrap it in <Content>.` });
  }
  if (TABS.has(child) && TABSLIST_NOT_IN.has(parent)) out.push({ id: "slot-tabslist-in-header", message: `<${child}> lives in a <Header> of the container (a second header with the concept tabs), not straight in <${parent}>.` });
  if (parent === "Content" && FULL_BLEED_IN_CONTAINER.has(child)) out.push({ id: "slot-fullbleed-in-content", message: `<${child}> is full-bleed by default; place it straight in the container, not inside <Content>.` });
  const allowed = SLOT_ALLOWED[parent];
  if (allowed !== undefined && allowed !== "*" && !allowed.has(child) && !child.startsWith("__")) out.push({ id: "slot-forbidden-child", message: `<${child}> is not allowed inside <${parent}>.` });
  if (NO_PAD.has(child) && childHasPad) out.push({ id: "slot-stack-no-pad", message: `<${child}> must not write pad=; the carrying slot owns the padding.` });
  return out;
}
