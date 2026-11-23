import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { Text } from "@libs/mobile-components";
import { Stack } from "@libs/mobile-layouts";

/** Chrome shared by every fixture: a labelled row of variants, and the scrolling body that holds the rows. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={10}>
      <Text type="bodyExtraSmall" color="gray-500">{label}</Text>
      <Stack dir="row" gap={10} wrap align="center">{children}</Stack>
    </Stack>
  );
}

export function FixtureBody({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Stack gap={24}>{children}</Stack>
    </ScrollView>
  );
}

/** A titled block of a foundations page. */
export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap={10}>
      <Text type="numbersExtraSmall" color="gray-500" style={{ textTransform: "uppercase" }}>{title}</Text>
      {children}
    </Stack>
  );
}
