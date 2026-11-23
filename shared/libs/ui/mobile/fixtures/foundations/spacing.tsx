import { View } from "react-native";
import { Text, useColor, useTheme } from "@libs/mobile-components";
import { Stack } from "@libs/mobile-layouts";
import { FixtureBody } from "../_chrome";

/** Spacing — the scale, in points, each step drawn at its size. Read from the theme. */
const STEPS = ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"];

export default function SpacingFixture() {
  const { theme } = useTheme();
  const bar = useColor("brand-1");
  return (
    <FixtureBody>
      {STEPS.filter((s) => theme.spacing[s] != null).map((s) => (
        <Stack key={s} dir="row" align="center" gap={12}>
          <Text type="numbersSmall" style={{ width: 36 }}>{s}</Text>
          <View style={{ width: theme.spacing[s], height: 16, backgroundColor: bar }} />
          <Text type="numbersExtraSmall" color="gray-500">{theme.spacing[s]}</Text>
        </Stack>
      ))}
    </FixtureBody>
  );
}
