import { View } from "react-native";
import { Text, useColor, useTheme } from "@libs/mobile-components";
import { Stack } from "@libs/mobile-layouts";
import { FixtureBody } from "../_chrome";

/** Radius — the scale, each step on a square. Read from the theme. */
export default function RadiusFixture() {
  const { theme } = useTheme();
  const fill = useColor("brand-1-light");
  const line = useColor("brand-1");
  return (
    <FixtureBody>
      <Stack dir="row" wrap gap={16}>
        {Object.entries(theme.radius).map(([name, value]) => (
          <Stack key={name} gap={4} align="center">
            <View style={{ width: 64, height: 64, borderRadius: Math.min(value, 32), backgroundColor: fill, borderWidth: 1, borderColor: line }} />
            <Text type="numbersSmall">{name}</Text>
            <Text type="numbersExtraSmall" color="gray-500">{value}</Text>
          </Stack>
        ))}
      </Stack>
    </FixtureBody>
  );
}
