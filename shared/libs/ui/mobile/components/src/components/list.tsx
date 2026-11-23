// Contract: list--list with control--list-item rows (ui/types/elements.ts) · mirrors @libs/web-components List, 0.1.0
import { Pressable, Text as RNText, View, type PressableProps, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { Children, cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import type { MobileState, Sibling } from "../../../../types/axes";
import type { EmphasisOf, ScaleOf, StatusOf } from "../../../../types/elements";
import { positionsOf, useElement, useType } from "../theme";
import { Icon, type IconName } from "./icons";

export interface ListProps extends Omit<ViewProps, "style"> {
  emphasis?: EmphasisOf<"list">;
  status?: StatusOf<"list">;
  scale?: ScaleOf<"list">;
  style?: StyleProp<ViewStyle>;
  /** ListItem children: each is told where it stands, so the last one draws no line */
  children?: ReactNode;
}

export function List({ emphasis, status, scale, style, children, ...rest }: ListProps) {
  const el = useElement("list", { emphasis, status, scale });
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<{ positions?: Sibling[] }>[];
  return (
    <View accessibilityRole="list" style={[{ alignSelf: "stretch" }, el.view, style]} {...rest}>
      {items.map((child, i) => cloneElement(child, { positions: positionsOf(i, items.length) }))}
    </View>
  );
}

export interface ListItemProps extends Omit<PressableProps, "style" | "children" | "disabled"> {
  title: string;
  description?: string;
  /** before the text: an icon by its name, or anything (an avatar) */
  start?: IconName | ReactNode;
  /** after the text: anything (a badge, a switch). A row that can be pressed shows a chevron when this is absent */
  end?: ReactNode;
  status?: StatusOf<"listItem">;
  state?: MobileState;
  selected?: boolean;
  disabled?: boolean;
  /** where it stands in its list; a List sets it */
  positions?: Sibling[];
  style?: StyleProp<ViewStyle>;
}

export function ListItem({ title, description, start, end, status, state, selected = false, disabled = false, positions, onPress, style, ...rest }: ListItemProps) {
  const [pressed, setPressed] = useState(false);
  const states: MobileState[] = [];
  if (state) states.push(state);
  if (selected) states.push("selected");
  if (pressed && !disabled) states.push("active");
  if (disabled) states.push("disabled");
  const el = useElement("listItem", { status, states, positions });
  const hint = useElement("fieldDescription");
  const small = useType("bodySmall");
  const body = (
    <>
      {typeof start === "string" ? <Icon name={start as IconName} color={el.color} /> : start}
      <View style={{ flex: 1, minWidth: 0 }}>
        <RNText style={el.text}>{title}</RNText>
        {description ? <RNText style={[small, { color: hint.color }]}>{description}</RNText> : null}
      </View>
      {end ?? (onPress ? <Icon name="chevronRight" size="sm" color={hint.color} /> : null)}
    </>
  );
  const base: ViewStyle = { flexDirection: "row", alignItems: "center", alignSelf: "stretch" };
  if (!onPress) return <View testID={rest.testID} accessibilityRole="none" style={[base, el.view, style]}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[base, el.view, style]}
      {...rest}
    >
      {body}
    </Pressable>
  );
}
