import { Icon, Text, iconRegistry, useTheme, type IconName, type IconScale } from "@libs/mobile-components";
import { Stack } from "@libs/mobile-layouts";
import { Block, FixtureBody } from "../_chrome";

/** Icons — the sizes of the theme, then every semantic name of the registry. One icon set, the web's. */
const SIZES: IconScale[] = ["xs", "sm", "md", "lg", "xl"];

export default function IconsFixture() {
  const { theme } = useTheme();
  const names = Object.keys(iconRegistry) as IconName[];
  return (
    <FixtureBody>
      <Block title={`sizes · set ${theme.icons?.set ?? "none"} · weight ${theme.icons?.weight ?? "none"}`}>
        <Stack dir="row" gap={20} align="end">
          {SIZES.map((s) => (
            <Stack key={s} gap={4} align="center">
              <Icon name="calendar" size={s} />
              <Text type="numbersExtraSmall" color="gray-500">{s} · {theme.icons?.sizes[s]}</Text>
            </Stack>
          ))}
        </Stack>
      </Block>
      <Block title={`names · ${names.length}`}>
        <Stack dir="row" wrap gap={12}>
          {names.map((n) => (
            <Stack key={n} gap={4} align="center" style={{ width: 76 }}>
              <Icon name={n} />
              <Text type="numbersExtraSmall" color="gray-500" align="center">{n}</Text>
            </Stack>
          ))}
        </Stack>
      </Block>
    </FixtureBody>
  );
}
