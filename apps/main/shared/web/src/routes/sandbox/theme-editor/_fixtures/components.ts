import type { ComponentType } from "react";

// Foundation
import ColorPrimitivesFixture from "./elements/foundation/colors-primitives";
import ColorDerivationsFixture from "./elements/foundation/colors-derivations";
import TypographyFixture from "./elements/foundation/typography";
import SeparatorFixture from "./elements/foundation/separator";
import LabelFixture from "./elements/foundation/label";

// Indicators
import BadgeFixture from "./elements/indicators/badge";
import AvatarFixture from "./elements/indicators/avatar";
import SpinnerFixture from "./elements/indicators/spinner";
import SkeletonFixture from "./elements/indicators/skeleton";
import ProgressFixture from "./elements/indicators/progress";
import ToastFixture from "./elements/indicators/toast";

// Controls
import ButtonFixture from "./elements/controls/button";
import SwitchFixture from "./elements/controls/switch";
import CheckboxFixture from "./elements/controls/checkbox";
import RadioFixture from "./elements/controls/radio";
import ToggleFixture from "./elements/controls/toggle";

// Control groups
import ButtonGroupFixture from "./elements/control-groups/button-group";
import ChipFixture from "./elements/control-groups/chip";
import TabsFixture from "./elements/control-groups/tabs";

// Navigation
import BreadcrumbFixture from "./elements/navigation/breadcrumb";
import PaginationFixture from "./elements/navigation/pagination";
import SidebarFixture from "./elements/navigation/sidebar";
import SidebarExpandableSectionFixture from "./elements/navigation/sidebar-expandable-section";

// Fields
import InputFixture from "./elements/fields/input";
import TextareaFixture from "./elements/fields/textarea";
import SelectFixture from "./elements/fields/select";
import ComboboxFixture from "./elements/fields/combobox";
import MultiSelectFixture from "./elements/fields/multi-select";
import DatePickerFixture from "./elements/fields/date-picker";
import InputGroupFixture from "./elements/fields/input-group";
import InputOtpFixture from "./elements/fields/input-otp";
import PhoneInputFixture from "./elements/fields/phone-input";
import FileUploadFixture from "./elements/fields/file-upload";
import FormFixture from "./elements/fields/form";

// Lists
import ListFixture from "./elements/lists/list";
import AccordionFixture from "./elements/lists/accordion";
import CollapsibleFixture from "./elements/lists/collapsible";
import TreeViewFixture from "./elements/lists/tree-view";
import ScrollAreaFixture from "./elements/lists/scroll-area";

// Data
import TableFixture from "./elements/data/table";

// Surfaces
import CardFixture from "./elements/surfaces/card";
import AlertFixture from "./elements/surfaces/alert";
import EmptyStateFixture from "./elements/surfaces/empty-state";
import ExpandableCardFixture from "./elements/surfaces/expandable-card";

// Overlays
import DialogFixture from "./elements/overlays/dialog";
import AlertDialogFixture from "./elements/overlays/alert-dialog";
import SheetFixture from "./elements/overlays/sheet";
import PopoverFixture from "./elements/overlays/popover";
import HoverCardFixture from "./elements/overlays/hover-card";
import TooltipFixture from "./elements/overlays/tooltip";
import DropdownMenuFixture from "./elements/overlays/dropdown-menu";
import CommandFixture from "./elements/overlays/command";

/**
 * Component-based fixtures — element-level previews that render the REAL
 * `@libs/web-components` with prop permutations. When a component changes,
 * the fixture follows automatically.
 *
 * Add a new fixture: import it, then append an entry. Folder structure
 * mirrors the tree picker (`path` is what the FixtureSelector groups by).
 *
 * Independent of `_fixtures/generated.ts` — that file is for the HTML
 * scraper pipeline and is not part of this list.
 */
export type ComponentFixture = {
  id: string;
  path: string[];
  label: string;
  Component: ComponentType;
};

export const COMPONENT_FIXTURES: ComponentFixture[] = [
  // foundation
  { id: "elements/foundation/color-primitives",            path: ["elements", "foundation", "color-primitives"],            label: "Color Primitives",    Component: ColorPrimitivesFixture },
  { id: "elements/foundation/color-derivations",           path: ["elements", "foundation", "color-derivations"],           label: "Color Derivations",   Component: ColorDerivationsFixture },
  { id: "elements/foundation/typography",                  path: ["elements", "foundation", "typography"],                  label: "Typography",          Component: TypographyFixture },
  { id: "elements/foundation/separator",                   path: ["elements", "foundation", "separator"],                   label: "Separator",           Component: SeparatorFixture },
  { id: "elements/foundation/label",                       path: ["elements", "foundation", "label"],                       label: "Label",               Component: LabelFixture },
  // indicators
  { id: "elements/indicators/badge",                       path: ["elements", "indicators", "badge"],                       label: "Badge",               Component: BadgeFixture },
  { id: "elements/indicators/avatar",                      path: ["elements", "indicators", "avatar"],                      label: "Avatar",              Component: AvatarFixture },
  { id: "elements/indicators/spinner",                     path: ["elements", "indicators", "spinner"],                     label: "Spinner",             Component: SpinnerFixture },
  { id: "elements/indicators/skeleton",                    path: ["elements", "indicators", "skeleton"],                    label: "Skeleton",            Component: SkeletonFixture },
  { id: "elements/indicators/progress",                    path: ["elements", "indicators", "progress"],                    label: "Progress",            Component: ProgressFixture },
  { id: "elements/indicators/toast",                      path: ["elements", "indicators", "toast"],                       label: "Toast",              Component: ToastFixture },
  // controls
  { id: "elements/controls/button",                        path: ["elements", "controls", "button"],                        label: "Button",              Component: ButtonFixture },
  { id: "elements/controls/switch",                        path: ["elements", "controls", "switch"],                        label: "Switch",              Component: SwitchFixture },
  { id: "elements/controls/checkbox",                      path: ["elements", "controls", "checkbox"],                      label: "Checkbox",            Component: CheckboxFixture },
  { id: "elements/controls/radio",                         path: ["elements", "controls", "radio"],                         label: "Radio",               Component: RadioFixture },
  { id: "elements/controls/toggle",                        path: ["elements", "controls", "toggle"],                        label: "Toggle",              Component: ToggleFixture },
  // control-groups
  { id: "elements/control-groups/button-group",            path: ["elements", "control-groups", "button-group"],            label: "Button Group",        Component: ButtonGroupFixture },
  { id: "elements/control-groups/chip",                    path: ["elements", "control-groups", "chip"],                    label: "Chip",                Component: ChipFixture },
  { id: "elements/control-groups/tabs",                    path: ["elements", "control-groups", "tabs"],                    label: "Tabs",                Component: TabsFixture },
  // navigation
  { id: "elements/navigation/breadcrumb",                  path: ["elements", "navigation", "breadcrumb"],                  label: "Breadcrumb",          Component: BreadcrumbFixture },
  { id: "elements/navigation/pagination",                  path: ["elements", "navigation", "pagination"],                  label: "Pagination",          Component: PaginationFixture },
  { id: "elements/navigation/sidebar",                     path: ["elements", "navigation", "sidebar"],                     label: "Sidebar",             Component: SidebarFixture },
  { id: "elements/navigation/sidebar-expandable-section",  path: ["elements", "navigation", "sidebar-expandable-section"],  label: "Sidebar Section",     Component: SidebarExpandableSectionFixture },
  // fields
  { id: "elements/fields/input",                           path: ["elements", "fields", "input"],                           label: "Input",               Component: InputFixture },
  { id: "elements/fields/textarea",                        path: ["elements", "fields", "textarea"],                        label: "Textarea",            Component: TextareaFixture },
  { id: "elements/fields/select",                          path: ["elements", "fields", "select"],                          label: "Select",              Component: SelectFixture },
  { id: "elements/fields/combobox",                        path: ["elements", "fields", "combobox"],                        label: "Combobox",            Component: ComboboxFixture },
  { id: "elements/fields/multi-select",                    path: ["elements", "fields", "multi-select"],                    label: "Multi Select",        Component: MultiSelectFixture },
  { id: "elements/fields/date-picker",                     path: ["elements", "fields", "date-picker"],                     label: "Date Picker",         Component: DatePickerFixture },
  { id: "elements/fields/input-group",                     path: ["elements", "fields", "input-group"],                     label: "Input Group",         Component: InputGroupFixture },
  { id: "elements/fields/input-otp",                       path: ["elements", "fields", "input-otp"],                       label: "Input OTP",           Component: InputOtpFixture },
  { id: "elements/fields/phone-input",                     path: ["elements", "fields", "phone-input"],                     label: "Phone Input",         Component: PhoneInputFixture },
  { id: "elements/fields/file-upload",                     path: ["elements", "fields", "file-upload"],                     label: "File Upload",         Component: FileUploadFixture },
  { id: "elements/fields/form",                            path: ["elements", "fields", "form"],                            label: "Form",                Component: FormFixture },
  // lists
  { id: "elements/lists/list",                             path: ["elements", "lists", "list"],                             label: "List",                Component: ListFixture },
  { id: "elements/lists/accordion",                        path: ["elements", "lists", "accordion"],                        label: "Accordion",           Component: AccordionFixture },
  { id: "elements/lists/collapsible",                      path: ["elements", "lists", "collapsible"],                      label: "Collapsible",         Component: CollapsibleFixture },
  { id: "elements/lists/tree-view",                        path: ["elements", "lists", "tree-view"],                        label: "Tree View",           Component: TreeViewFixture },
  { id: "elements/lists/scroll-area",                      path: ["elements", "lists", "scroll-area"],                      label: "Scroll Area",         Component: ScrollAreaFixture },
  // data
  { id: "elements/data/table",                             path: ["elements", "data", "table"],                             label: "Table",               Component: TableFixture },
  // surfaces
  { id: "elements/surfaces/card",                          path: ["elements", "surfaces", "card"],                          label: "Card",                Component: CardFixture },
  { id: "elements/surfaces/alert",                         path: ["elements", "surfaces", "alert"],                         label: "Alert",               Component: AlertFixture },
  { id: "elements/surfaces/empty-state",                   path: ["elements", "surfaces", "empty-state"],                   label: "Empty State",         Component: EmptyStateFixture },
  { id: "elements/surfaces/expandable-card",               path: ["elements", "surfaces", "expandable-card"],               label: "Expandable Card",     Component: ExpandableCardFixture },
  // overlays
  { id: "elements/overlays/dialog",                        path: ["elements", "overlays", "dialog"],                        label: "Dialog",              Component: DialogFixture },
  { id: "elements/overlays/alert-dialog",                  path: ["elements", "overlays", "alert-dialog"],                  label: "Alert Dialog",        Component: AlertDialogFixture },
  { id: "elements/overlays/sheet",                         path: ["elements", "overlays", "sheet"],                         label: "Sheet",               Component: SheetFixture },
  { id: "elements/overlays/popover",                       path: ["elements", "overlays", "popover"],                       label: "Popover",             Component: PopoverFixture },
  { id: "elements/overlays/hover-card",                    path: ["elements", "overlays", "hover-card"],                    label: "Hover Card",          Component: HoverCardFixture },
  { id: "elements/overlays/tooltip",                       path: ["elements", "overlays", "tooltip"],                       label: "Tooltip",             Component: TooltipFixture },
  { id: "elements/overlays/dropdown-menu",                 path: ["elements", "overlays", "dropdown-menu"],                 label: "Dropdown Menu",       Component: DropdownMenuFixture },
  { id: "elements/overlays/command",                       path: ["elements", "overlays", "command"],                       label: "Command",             Component: CommandFixture },
];
