import { List, ListItem, Text } from "@libs/mobile-components";
import type { TabBarItem } from "@libs/mobile-layouts";

export const TABS: TabBarItem[] = [
  { value: "home", label: "Home", icon: "home" },
  { value: "members", label: "Members", icon: "users" },
  { value: "account", label: "Account", icon: "user" },
];

/** stand-in content: enough rows to show where the body scrolls */
export function Rows({ count = 8 }: { count?: number }) {
  return (
    <List>
      {Array.from({ length: count }, (_, i) => <ListItem key={i} title={`Row ${i + 1}`} onPress={() => {}} />)}
    </List>
  );
}

export function Note({ children }: { children: string }) {
  return <Text type="bodySmall" color="gray-500">{children}</Text>;
}
