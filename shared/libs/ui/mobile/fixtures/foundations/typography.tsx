import type { ComponentProps } from "react";
import { Text, useTheme } from "@libs/mobile-components";
import { Stack } from "@libs/mobile-layouts";
import { FixtureBody } from "../_chrome";

/** Typography — every level of the theme, set in itself, with its numbers. Read from the theme. */
export default function TypographyFixture() {
  const { theme } = useTheme();
  return (
    <FixtureBody>
      {Object.entries(theme.typography.types).map(([key, level]) => (
        <Stack key={key} gap={2}>
          <Text type={key as ComponentProps<typeof Text>["type"]}>{key}</Text>
          <Text type="numbersExtraSmall" color="gray-500">
            {level.fontFamily} · {level.fontSize} / {level.lineHeight} · {level.fontWeight}{level.letterSpacing ? ` · ${level.letterSpacing}` : ""}
          </Text>
        </Stack>
      ))}
    </FixtureBody>
  );
}
