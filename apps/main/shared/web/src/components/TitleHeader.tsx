/**
 * TitleHeader — the title band: an icon and the page's title, in the page header.
 * One place for what the layouts used to write by hand.
 */
import { Stack } from "@libs/web-layouts";
import { Icon, type IconName } from "@libs/web-components";

export interface TitleHeaderProps {
  icon: IconName;
  title: string;
  /** data-testid of the title, where a test addresses it. */
  titleTestId?: string;
}

export function TitleHeader({ icon, title, titleTestId }: TitleHeaderProps) {
  return (
    <Stack dir="row" align="center" gap={8} className="h-full px-6">
      <Icon name={icon} />
      <h1 element="type--heading2" data-testid={titleTestId}>
        {title}
      </h1>
    </Stack>
  );
}
