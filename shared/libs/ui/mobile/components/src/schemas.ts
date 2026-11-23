// The props schema of every component of the mobile library, for tooling (the UI-as-data validator and interpreter read them): pure data, no React Native here,
// so a node script can read it. The same shape as the web library's defineProps: { component, props: { name: { kind, values?, default?, required?, doc? } } }.
// Every component also takes `testID` and `style`, common to all; a callback is an event the component hands up (`onX` → `on.x` in a document).
import { defineProps } from "../../../types/define-props";
import { axesSchema } from "../../../types/axes-schema";
import type { AlertProps } from "./components/alert";
import type { AvatarProps } from "./components/avatar";
import type { BadgeProps } from "./components/badge";
import type { ButtonProps } from "./components/button";
import type { CardProps } from "./components/card";
import type { CheckboxProps } from "./components/checkbox";
import type { ChoiceGroupProps } from "./components/choice-group";
import type { EmptyStateProps } from "./components/empty-state";
import type { FieldProps, LabelProps } from "./components/field";
import type { GroupProps } from "./components/group";
import type { IconProps } from "./components/icons";
import type { InputOTPProps } from "./components/input-otp";
import type { InputProps } from "./components/input";
import type { ListProps, ListItemProps } from "./components/list";
import type { SheetProps, DialogProps } from "./components/overlays";
import type { PhoneInputProps } from "./components/phone-input";
import type { StepperProps } from "./components/stepper";
import type { SwitchProps } from "./components/switch";
import type { TextProps } from "./components/text";
import type { QrCodeProps } from "./components/qr-code";
import type { ListPaginationProps } from "./components/list-pagination";

type P<T, K extends keyof T> = Pick<T, K>;
const str = (doc?: string) => ({ kind: "string" as const, ...(doc ? { doc } : {}) });
const bool = (def?: boolean, doc?: string) => ({ kind: "boolean" as const, ...(def !== undefined ? { default: def } : {}), ...(doc ? { doc } : {}) });
const num = (def?: number, doc?: string) => ({ kind: "number" as const, ...(def !== undefined ? { default: def } : {}), ...(doc ? { doc } : {}) });
const fn = (doc: string) => ({ kind: "function" as const, doc });
const node = (doc: string) => ({ kind: "node" as const, doc });
const other = (doc: string) => ({ kind: "other" as const, doc });
const MOBILE_STATE = ["active", "focus", "selected", "disabled", "loading", "long-pressed", "swiped"] as const;

export const alertSchema = defineProps<P<AlertProps, "status" | "emphasis" | "title" | "description" | "icon" | "action">>("Alert", {
  status: axesSchema("alert").status as never, emphasis: axesSchema("alert").emphasis as never,
  title: str("The title"), description: str("The text under the title"), icon: str("An icon name; null for none"), action: node("An action under the text"),
});
export const avatarSchema = defineProps<P<AvatarProps, "name" | "image" | "emphasis" | "status" | "scale">>("Avatar", {
  name: { ...str("The person's or organization's name: its initials when there is no image"), required: true }, image: str("The image URL; null for none"),
  emphasis: axesSchema("avatar").emphasis as never, status: axesSchema("avatar").status as never, scale: { kind: "enum", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
});
export const badgeSchema = defineProps<P<BadgeProps, "emphasis" | "status" | "scale">>("Badge", { emphasis: axesSchema("badge").emphasis as never, status: axesSchema("badge").status as never, scale: axesSchema("badge").scale as never });
export const buttonSchema = defineProps<P<ButtonProps, "emphasis" | "status" | "scale" | "state" | "disabled" | "loading" | "startIcon" | "endIcon" | "fill" | "onPress">>("Button", {
  emphasis: axesSchema("button").emphasis as never, status: axesSchema("button").status as never, scale: axesSchema("button").scale as never, state: { kind: "enum", values: MOBILE_STATE },
  disabled: bool(false), loading: bool(false, "A spinner in place of the content"), startIcon: str("Icon before the label"), endIcon: str("Icon after the label"), fill: bool(false, "As wide as its parent"),
  onPress: fn("() — pressed"),
});
export const cardSchema = defineProps<P<CardProps, "emphasis" | "status" | "scale" | "state" | "disabled" | "onPress" | "onLongPress">>("Card", {
  emphasis: axesSchema("card").emphasis as never, status: axesSchema("card").status as never, scale: axesSchema("card").scale as never, state: { kind: "enum", values: MOBILE_STATE },
  disabled: bool(false), onPress: fn("() — pressed (the card is pressable when given)"), onLongPress: fn("() — long-pressed"),
});
export const cardHeaderSchema = defineProps<Record<never, never>>("CardHeader", {});
export const cardContentSchema = defineProps<Record<never, never>>("CardContent", {});
export const cardFooterSchema = defineProps<Record<never, never>>("CardFooter", {});
export const checkboxSchema = defineProps<P<CheckboxProps, "checked" | "onCheckedChange" | "label" | "status" | "disabled" | "accessibilityLabel">>("Checkbox", {
  checked: { ...bool(), required: true }, onCheckedChange: fn("(checked) — toggled"), label: node("The label beside the box"), status: axesSchema("checkbox").status as never, disabled: bool(false), accessibilityLabel: str(),
});
export const choiceGroupSchema = defineProps<P<ChoiceGroupProps, "value" | "onChange" | "options" | "emphasis" | "status" | "scale" | "disabled" | "accessibilityLabel">>("ChoiceGroup", {
  value: { ...str("The selected option's value"), required: true }, onChange: fn("(value) — the option the user chose"), options: { ...other("[{ value, label, disabled?, testID? }]"), required: true },
  emphasis: axesSchema("choiceGroup").emphasis as never, status: axesSchema("choiceGroup").status as never, scale: axesSchema("choiceGroup").scale as never, disabled: bool(false), accessibilityLabel: str(),
});
export const emptyStateSchema = defineProps<P<EmptyStateProps, "icon" | "title" | "description" | "action" | "emphasis" | "status">>("EmptyState", {
  icon: str("Icon above the title"), title: { ...str("The message"), required: true }, description: str("The text under it"), action: node("An action under the text"),
  emphasis: axesSchema("emptyState").emphasis as never, status: axesSchema("emptyState").status as never,
});
export const fieldSchema = defineProps<P<FieldProps, "label" | "description" | "error" | "required" | "scale">>("Field", {
  label: str("The label above the control"), description: str("Help under the control"), error: str("The error under the control; sets the control's status"), required: bool(false), scale: axesSchema("input").scale as never,
});
export const labelSchema = defineProps<P<LabelProps, "status" | "scale">>("Label", { status: axesSchema("label").status as never, scale: axesSchema("label").scale as never });
export const groupSchema = defineProps<P<GroupProps, "title" | "trailing">>("Group", { title: str("The group's title"), trailing: node("After the title: an action") });
export const iconSchema = defineProps<P<IconProps, "name" | "size" | "color">>("Icon", { name: { ...str("Semantic icon name"), required: true }, size: { kind: "enum", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, color: str("A colour of the theme, by name") });
export const inputOTPSchema = defineProps<P<InputOTPProps, "length" | "value" | "onChangeText" | "onComplete" | "status" | "disabled" | "autoFocus" | "accessibilityLabel">>("InputOTP", {
  length: num(6), value: { ...str(), required: true }, onChangeText: fn("(value) — the digits typed"), onComplete: fn("(value) — every digit typed"), status: axesSchema("otp").status as never, disabled: bool(false), autoFocus: bool(), accessibilityLabel: str(),
});
export const inputSchema = defineProps<P<InputProps, "emphasis" | "status" | "scale" | "state" | "disabled" | "start" | "end" | "value" | "placeholder" | "onChangeText" | "secureTextEntry" | "autoFocus" | "keyboardType" | "autoComplete" | "autoCapitalize">>("Input", {
  emphasis: axesSchema("input").emphasis as never, status: axesSchema("input").status as never, scale: axesSchema("input").scale as never, state: { kind: "enum", values: MOBILE_STATE },
  disabled: bool(false), start: node("Inside the field, on the left"), end: node("Inside the field, on the right"), value: str(), placeholder: str(), onChangeText: fn("(value) — the text typed"),
  secureTextEntry: bool(false, "A password"), autoFocus: bool(), keyboardType: str("React Native keyboardType"), autoComplete: str("React Native autoComplete"),
  autoCapitalize: { kind: "enum", values: ["none", "sentences", "words", "characters"], doc: "React Native autoCapitalize" },
});
export const listSchema = defineProps<P<ListProps, "emphasis" | "status" | "scale">>("List", { emphasis: axesSchema("list").emphasis as never, status: axesSchema("list").status as never, scale: axesSchema("list").scale as never });
export const listItemSchema = defineProps<P<ListItemProps, "title" | "description" | "start" | "end" | "status" | "state" | "selected" | "disabled" | "onPress" | "accessibilityLabel">>("ListItem", {
  title: { ...str(), required: true }, description: str(), start: other("An icon name, or a node, before the text"), end: node("After the text: a badge, a chevron, an action"),
  status: axesSchema("listItem").status as never, state: { kind: "enum", values: MOBILE_STATE }, selected: bool(false), disabled: bool(false), onPress: fn("() — pressed"), accessibilityLabel: str(),
});
export const sheetSchema = defineProps<P<SheetProps, "open" | "onClose" | "title" | "scale" | "status">>("Sheet", {
  open: { ...bool(), required: true }, onClose: fn("() — dismissed"), title: str(), scale: { kind: "enum", values: ["sm", "md", "lg"] }, status: axesSchema("sheet").status as never,
});
export const dialogSchema = defineProps<P<DialogProps, "open" | "onClose" | "title" | "description" | "actions" | "status">>("Dialog", {
  open: { ...bool(), required: true }, onClose: fn("() — dismissed"), title: str(), description: str(), actions: node("The buttons"), status: axesSchema("dialog").status as never,
});
export const phoneInputSchema = defineProps<P<PhoneInputProps, "value" | "onChangeText" | "onBlur" | "onRequestCountryChange" | "status" | "scale" | "disabled" | "placeholder" | "accessibilityLabel" | "autoFocus">>("PhoneInput", {
  value: { ...str("E.164"), required: true }, onChangeText: fn("(e164) — the full number on every change"), onBlur: fn("() — left the field"), onRequestCountryChange: fn("(current, setCountry) — the country chip was pressed: a picker may set the country"), status: axesSchema("phoneInput").status as never, scale: axesSchema("phoneInput").scale as never,
  disabled: bool(false), placeholder: str(), accessibilityLabel: str(), autoFocus: bool(),
});
export const stepperSchema = defineProps<P<StepperProps, "value" | "onChange" | "min" | "max" | "step" | "disabled" | "scale" | "accessibilityLabel">>("Stepper", {
  value: { ...num(), required: true }, onChange: fn("(next) — the value after a step"), min: num(), max: num(), step: num(1), disabled: bool(false), scale: axesSchema("buttonGroup").scale as never, accessibilityLabel: str(),
});
export const switchSchema = defineProps<P<SwitchProps, "checked" | "onCheckedChange" | "status" | "disabled" | "accessibilityLabel">>("Switch", {
  checked: { ...bool(), required: true }, onCheckedChange: fn("(checked) — toggled"), status: axesSchema("switch").status as never, disabled: bool(false), accessibilityLabel: str(),
});
export const textSchema = defineProps<P<TextProps, "type" | "color" | "align">>("Text", {
  type: { kind: "string", default: "body", doc: "The typography element: type--<level> (heading1 … body-small, link)" }, color: str("A colour of the theme, by name"), align: { kind: "enum", values: ["left", "center", "right"] },
});
export const qrCodeSchema = defineProps<P<QrCodeProps, "value" | "size">>("QrCode", { value: { ...str("The value to encode"), required: true }, size: num(200, "The side, in points") });
export const listPaginationSchema = defineProps<P<ListPaginationProps, "query" | "total" | "onPageChange">>("ListPagination", {
  query: { ...other("{ page, pageSize }"), required: true }, total: { ...num(), required: true }, onPageChange: fn("(page) — the page the user asked for"),
});
