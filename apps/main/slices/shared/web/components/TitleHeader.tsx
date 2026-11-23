/**
 * TitleHeader — the title band: an icon and the page's title, in the page header. What every slice layout puts in pageHeaderContent.
 * Shared by the slices (apps/main/slices/shared), like the empty state: not a layout, not the library's.
 */
import { Icon, type IconName } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";

export interface TitleHeaderProps {
  icon: IconName;
  title: string;
  /** data-testid of the title, where a test addresses it. */
  titleTestId?: string;
}

export function TitleHeader({ icon, title, titleTestId }: TitleHeaderProps) {
  return (
    <Stack dir="row" align="center" scale="sm" className="h-full px-6">
      <Icon name={icon} />
      <h1 element="type--heading2" data-testid={titleTestId}>
        {title}
      </h1>
    </Stack>
  );
}
