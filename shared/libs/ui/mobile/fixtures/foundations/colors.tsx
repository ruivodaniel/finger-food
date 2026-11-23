import { View } from "react-native";
import { Text, useTheme } from "@libs/mobile-components";
import { Stack } from "@libs/mobile-layouts";
import { Block, FixtureBody } from "../_chrome";

/**
 * Colours — every colour of the active mode, as the engine resolved it. Read from the theme:
 * no list is kept here. Grouped by the name's prefix (main, brand, status, flat, gray), the
 * semantic names first.
 */
const SEMANTIC = ["background", "foreground", "primary", "secondary", "accent", "muted"];
const GROUPS: [string, (k: string) => boolean][] = [
  ["semantic", (k) => SEMANTIC.includes(k)],
  ["main", (k) => k.startsWith("main-")],
  ["brand", (k) => /^brand-\d+$/.test(k)],
  ["status", (k) => k.startsWith("status-")],
  ["gray", (k) => /^gray-\d+$/.test(k)],
  ["content", (k) => k.startsWith("content-")],
];

function Swatch({ name, value }: { name: string; value: string }) {
  const { mode } = useTheme();
  return (
    <Stack gap={4} style={{ width: 104 }}>
      <View style={{ height: 44, backgroundColor: value, borderWidth: 1, borderColor: mode.palette["gray-200"] }} />
      <Text type="bodyExtraSmall">{name}</Text>
      <Text type="numbersExtraSmall" color="gray-500">{value}</Text>
    </Stack>
  );
}

export default function ColorsFixture() {
  const { mode, modeName } = useTheme();
  const keys = Object.keys(mode.palette);
  return (
    <FixtureBody>
      <Text type="bodySmall" color="gray-600">mode: {modeName} · {keys.length} colours</Text>
      {GROUPS.map(([title, test]) => {
        const names = keys.filter(test);
        if (!names.length) return null;
        return (
          <Block key={title} title={title}>
            <Stack dir="row" wrap gap={12}>
              {names.map((k) => <Swatch key={k} name={k} value={mode.palette[k]} />)}
            </Stack>
          </Block>
        );
      })}
    </FixtureBody>
  );
}
