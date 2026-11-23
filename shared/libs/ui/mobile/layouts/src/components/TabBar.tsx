// The navigation at the bottom of a root screen: the region `tabBar`, its entries the element `navItem`.
import { Pressable, Text as RNText, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { useState } from "react";
import { Icon, useElement, useRegion, type IconName } from "@libs/mobile-components";

export interface TabBarItem<T extends string = string> {
  value: T;
  label: string;
  icon: IconName;
  disabled?: boolean;
  testID?: string;
}

export interface TabBarProps<T extends string = string> {
  value: T;
  onChange?: (value: T) => void;
  items: ReadonlyArray<TabBarItem<T>>;
  style?: StyleProp<ViewStyle>;
}

export function TabBar<T extends string = string>({ value, onChange, items, style }: TabBarProps<T>) {
  const region = useRegion("tabBar");
  return (
    <View accessibilityRole="tablist" style={[{ flexDirection: "row", alignItems: "stretch", flexShrink: 0, height: region.height as DimensionValue }, region.view, style]}>
      {items.map((item) => <Tab key={item.value} item={item} selected={item.value === value} onPress={() => onChange?.(item.value)} />)}
    </View>
  );
}

function Tab<T extends string>({ item, selected, onPress }: { item: TabBarItem<T>; selected: boolean; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  const el = useElement("navItem", { states: [...(selected ? (["selected"] as const) : []), ...(pressed ? (["active"] as const) : []), ...(item.disabled ? (["disabled"] as const) : [])] });
  return (
    <Pressable
      testID={item.testID}
      accessibilityRole="tab"
      accessibilityState={{ selected, disabled: !!item.disabled }}
      disabled={item.disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[{ flex: 1, alignItems: "center", justifyContent: "center" }, el.view]}
    >
      <Icon name={item.icon} size="lg" color={el.color} />
      <RNText numberOfLines={1} style={el.text}>{item.label}</RNText>
    </Pressable>
  );
}
