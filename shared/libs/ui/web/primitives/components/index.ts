/**
 * Primitive Components
 *
 * Shared primitive components used across all applications.
 * Import from @libs/web-components
 *
 * Examples: Button, Input, Dialog, Icon, etc.
 */

// Utility (commonly used with primitives)
export { cn } from "../../lib/utils";

// Domain-shaped inputs (composed primitives that handle a structured value type)
export {
  AddressAutocomplete,
  type AddressAutocompleteProps,
} from "./address-autocomplete";
export {
  AvatarUploadField,
  avatarUploadFieldSchema,
  type AvatarUploadFieldProps,
} from "./avatar-upload";
export {
  RemoteImage,
  type RemoteImageProps,
  remoteImageSchema
} from "./remote-image";

// Icons
export { Icon, iconSchema, type IconName, type IconProps, type IconScale } from './icons';
export { iconRegistry } from './icons';

// shadcn/ui primitives (migrated from ./shadcn)
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  type AccordionProps,
  type AccordionItemProps,
  type AccordionTriggerProps,
  type AccordionContentProps,
  accordionSchema, accordionItemSchema, accordionTriggerSchema, accordionContentSchema
} from "./accordion";
export {
  Alert,
  AlertTitle,
  AlertDescription,
  type AlertProps,
  type AlertEmphasis,
  type AlertStatus,
  type AlertScale,
  alertSchema,
  alertDescriptionSchema, alertTitleSchema,
} from "./alert";
export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  type AlertDialogContentProps,
  type AlertDialogStatus,
  type AlertDialogScale,
  alertDialogContentSchema, alertDialogActionSchema, alertDialogCancelSchema,
  alertDialogSchema, alertDialogTitleSchema, alertDialogDescriptionSchema,
} from "./alert-dialog";
export { Avatar, AvatarFallback, AvatarImage, type AvatarProps, type AvatarScale, avatarSchema,
  avatarImageSchema, avatarFallbackSchema,
} from "./avatar";
export { Badge, type BadgeProps, type BadgeEmphasis, type BadgeStatus, type BadgeScale, badgeSchema } from "./badge";
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  type BreadcrumbProps,
  type BreadcrumbScale,
  breadcrumbSchema, breadcrumbLinkSchema
} from "./breadcrumb";
export { Text, textSchema, TEXT_TAGS, TEXT_TYPES, type TextProps, type TextOwnProps, type TextTag, type TextType } from "./text";
export { Link, linkSchema, type LinkProps, type LinkOwnProps } from "./link";
export { Button, buttonSchema, type ButtonProps, type ButtonOwnProps, type ButtonEmphasis, type ButtonStatus, type ButtonScale, type ButtonType, type ButtonIconBg } from "./button";
export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  type ButtonGroupProps,
  type ButtonGroupScale,
  type ButtonGroupOrientation,
  buttonGroupSchema
} from "./button-group";
export { Chip, type ChipProps, type ChipEmphasis, type ChipStatus, type ChipScale, chipSchema } from "./chip";
export {
  Card,
  CardAction,
  CardDescription,
  CardTitle,
  cardSchema
} from "./card";
export { Tile, type TileProps, type TileOwnProps, tileSchema } from "./tile";
export {
  ColorPicker, Swatch, themePalettes, hexToHsv, hsvToHex, normalizeHex, resolveToHex, isHex,
  colorPickerSchema,
  type ColorPickerProps, type ColorPickerOwnProps, type ColorPalette, type PaletteColor, type ColorPickerScale, type ColorPickerStatus, type ColorPickerEmphasis,
} from "./color-picker/v1";
// PIN: ColorPicker and Swatch exist only in v1, and the things that use them have not moved to v2's PickerMenu. To remove with them.
// the colour picker v2 (one PickerMenu, a Trigger, the HexColorPicker); named apart from v1 until consumers move
export {
  PickerMenu, HexColorPicker, NumberSlider,
  pickerMenuSchema, hexColorPickerSchema,
  type PickerMenuProps, type PickerValue, type Section as PickerSection, type PaletteColor as PickerColor, type StrokeValue, type StrokePattern,
} from "./color-picker";
export {
  IconPicker, IconTile, libraryIcons, LIBRARY_ICONS,
  iconPickerSchema,
  type IconPickerProps, type IconPickerOwnProps, type IconLibrary, type IconOption, type IconRef, type IconPickerScale, type IconPickerStatus, type IconPickerEmphasis,
} from "./icon-picker";
export { Checkbox, type CheckboxProps, type CheckboxEmphasis, type CheckboxStatus, type CheckboxScale, checkboxSchema } from "./checkbox";
export {
  // Primitive (recommended)
  CollapsiblePrimitive,
  CollapsiblePrimitiveContent,
  CollapsiblePrimitiveTrigger,
  // Backward compat aliases
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  collapsibleSchema
} from "./collapsible";
export { SidebarExpandableSection, type SidebarExpandableSectionProps } from "./sidebar-expandable-section";
export {
  Combobox,
  type ComboboxProps,
  type ComboboxOption,
  type ComboboxScale,
  type ComboboxStatus,
} from "./_deprecated/combobox"; // deprecated: use InputSelect
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  type CommandDialogProps,
} from "./command";
export {
  DatePicker,
  type DatePickerProps,
  type DatePickerScale,
  type DatePickerStatus,
  type DateRange,
  datePickerSchema
} from "./date-picker";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type DialogContentProps,
  type DialogScale,
  dialogContentSchema
} from "./dialog";
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
  dropdownMenuContentSchema, dropdownMenuItemSchema,
  dropdownMenuSchema, dropdownMenuTriggerSchema,
  dropdownMenuCheckboxItemSchema,
} from "./dropdown-menu";
export { EmptyState, type EmptyStateProps, type EmptyStateScale, emptyStateSchema } from "./empty-state";
export { ExpandableCard, type ExpandableCardProps, type ExpandableCardIconPosition } from "./expandable-card";
export {
  FileUpload,
  type FileUploadProps,
  type FileUploadScale,
  type FileUploadStatus,
  fileUploadSchema
} from "./file-upload";
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "./form";
export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  type HoverCardContentProps,
  type HoverCardScale,
  hoverCardContentSchema
} from "./hover-card";
export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, type InputOTPProps, type InputOTPScale, inputOTPSchema } from "./input-otp";
export { InputSelect, inputSelectSchema, type InputSelectProps, type InputSelectOption, type InputSelectSearch } from "./input-select";
export { Input, type InputProps, type InputScale, type InputStatus, inputSchema } from "./input";
export {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
  type InputGroupProps,
  type InputGroupAddonProps,
  type InputGroupScale,
  type InputGroupStatus,
  type InputGroupAddonAlign,
  inputGroupSchema, inputGroupAddonSchema
} from "./input-group";
export { Label, labelSchema } from "./label";
export {
  List,
  ListItem,
  ListItemIcon,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemAction,
  listSchema, listItemSchema,
  listItemIconSchema, listItemContentSchema, listItemActionSchema, listItemTitleSchema, listItemDescriptionSchema,
} from "./list";
export {
  MultiSelect,
  type MultiSelectProps,
  type MultiSelectOption,
  type MultiSelectScale,
  type MultiSelectStatus,
} from "./_deprecated/multi-select"; // deprecated: use InputSelect
export {
  PhoneInput,
  type PhoneInputProps,
  type PhoneCountryOption,
  phoneInputSchema
} from "./phone-input";
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationSchema, paginationLinkSchema
} from "./pagination";
export { Chart, chartRegistry, useChartEntry, chartSchema, CHART_KINDS, type ChartProps, type ChartKind, type ChartSeries, type ChartPoint, type ChartEvent, type ChartScale, type ChartRenderer, type ChartZoom, type ChartAxes, type ChartStack } from "./chart";
export { ChartLegend, chartLegendSchema, type ChartLegendProps, type ChartLegendLayout, type ChartLegendValues } from "./chart-legend";
export { ChartToolbar, chartToolbarSchema, type ChartToolbarProps, type ChartToolbarPreset } from "./chart-toolbar";
export { MicroChart, microChartSchema, MICRO_CHART_KINDS, type MicroChartProps, type MicroChartKind, type MicroChartScale } from "./micro-chart";
export { DataTooltip, DataTooltipSurface, type DataTooltipProps, type DataTooltipTrigger, type DataTooltipSide, type DataTooltipAlign, dataTooltipSchema } from "./data-tooltip";
export { DataNumber, type DataNumberProps, type DataNumberScale, type DataNumberSymbolPosition, type DataNumberTooltipTrigger, dataNumberSchema } from "./data-number";
export {
  RichTable,
  richTableSchema,
  type RichTableProps,
  type RichTableColumn,
  type RichTableRow,
  type RichTableSource,
  type RichTableQuery,
  type RichTableResult,
  type RichTableSort,
  type RichTableView,
  type RichTableCellType,
} from "./rich-table";
export {
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  type PopoverContentProps,
  type PopoverScale,
  popoverContentSchema
} from "./popover";
export {
  Progress,
  type ProgressProps,
  type ProgressEmphasis,
  type ProgressStatus,
  type ProgressScale,
  progressSchema
} from "./progress";
export { QrCode, type QrCodeProps, qrCodeSchema } from "./qr-code";
export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupProps,
  type RadioGroupItemProps,
  type RadioGroupItemEmphasis,
  type RadioGroupItemStatus,
  type RadioGroupItemScale,
  radioGroupSchema, radioGroupItemSchema
} from "./radio-group";
// the components' own scroll-area is sunset (its folder holds sunset.json): the one ScrollArea is the layouts'
export { Header, Content, Footer, headerSchema, contentSchema, footerSchema } from "./parts";
// deprecated names of the one Header, Content and Footer, kept only so the earlier explorations still compile; to remove once they move
export { Header as CardHeader, Content as CardContent, Footer as CardFooter, Header as SheetHeader, Footer as SheetFooter, Header as DialogHeader, Footer as DialogFooter, Header as AlertDialogHeader, Footer as AlertDialogFooter } from "./parts";
export { Stack, type StackProps, type StackDir, type StackAlign, type StackJustify, type StackSize } from "./stack";
export { stackSchema } from "./stack";
export type { HeaderProps, ContentProps, FooterProps, Overflow } from "./parts";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger, type SelectTriggerProps, type SelectScale, type SelectStatus,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectLoading,
  SelectEmpty,
  selectTriggerSchema
} from "./_deprecated/select"; // deprecated: use InputSelect
export { Separator, type SeparatorProps, type SeparatorOrientation, separatorSchema } from "./separator";
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  type SheetContentProps,
  type SheetSide,
  type SheetScale,
  sheetContentSchema,
  sheetSchema, sheetTitleSchema, sheetDescriptionSchema, sheetTriggerSchema, sheetCloseSchema,
} from "./sheet";
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  sidebarProviderSchema, sidebarMenuButtonSchema, sidebarSchema, sidebarHeaderSchema, sidebarContentSchema, sidebarFooterSchema, sidebarGroupSchema, sidebarMenuSchema, sidebarMenuItemSchema,
} from "./sidebar";
export { Skeleton, skeletonSchema } from "./skeleton";
export { Topbar, topbarSchema, TopbarWhen, topbarWhenSchema } from "./topbar";
export { AvatarGenerator, avatarGeneratorSchema, type AvatarGeneratorProps } from "./avatar-generator";
export { Toaster, toast, toasterSchema } from "./toast";
export { Spinner, SpinnerOverlay, type SpinnerProps, type SpinnerScale, spinnerSchema, spinnerOverlaySchema } from "./spinner";
export { Switch, type SwitchProps, type SwitchEmphasis, type SwitchScale, switchSchema } from "./switch";
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  tableSchema, tableRowSchema, tableCellSchema,
  tableHeaderSchema, tableBodySchema, tableHeadSchema,
} from "./table";
export { Tabs, TabsContent, TabsList, TabsTrigger, tabsSchema, tabsListSchema, tabsTriggerSchema, tabsContentSchema } from "./tabs";
export { Textarea, type TextareaProps, type TextareaScale, type TextareaStatus, textareaSchema } from "./textarea";
export {
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  type ToggleProps,
  type ToggleGroupProps,
  type ToggleGroupItemProps,
  type ToggleEmphasis,
  type ToggleStatus,
  type ToggleScale,
  toggleSchema, toggleGroupSchema, toggleGroupItemSchema
} from "./toggle";
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  tooltipContentSchema
} from "./tooltip";
export {
  ListDraggable,
  moveItem,
  findItem,
  holds,
  type ListDraggableProps,
  type ListDraggableRowContext,
  type TreeItem,
  type DropPosition,
  listDraggableSchema
} from "./list-draggable";
export {
  ListTree,
  flattenTree,
  type ListTreeProps,
  type ListTreeNodeContext,
  type ListTreeItem,
  listTreeSchema
} from "./list-tree";
export {
  TreeView,
  type TreeViewProps,
  type TreeNode,
  type TreeViewScale,
  treeViewSchema
} from "./tree-view";
