/**
 * SettingsLayout — the /my/settings/* section: a "Settings" title band, the
 * section's OWN left panel (Account, Profile, Security, …), and the subpage in
 * the main column. Settings links live only here — never in the main shell
 * sidebar; the section is reached via the sidebar's user menu. The panel has no
 * collapse toggle; its items are the theme's sidebar items
 * (`control--sidebar-item`, `state="selected"`). The structure is PageLayout's.
 */

import { PageLayout } from "@/components/PageLayout";
import { TitleHeader } from "@/components/TitleHeader";
import { Icon } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { Outlet, useLinkProps, useMatchRoute } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { SETTINGS_NAV_ENTRIES, type AppNavEntry } from "@/config/navigation.config";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function SettingsLayout() {
  return (
    <PageLayout
      header={<TitleHeader icon="settings" title="Settings" />}
      sidebar={
        <nav
          data-testid="settings-nav"
          element="control-group--sidebar"
        >
          <Stack dir="col" gap={4} pad={16}>
            {SETTINGS_NAV_ENTRIES.map((entry) => (
              <SettingsNavItem key={entry.id} entry={entry} />
            ))}
          </Stack>
        </nav>
      }
    >
      {createElement(RouterOutlet)}
    </PageLayout>
  );
}

/**
 * One settings entry. A plain anchor carrying the router's link behaviour
 * (useLinkProps) rather than <Link>: <Link> reads `state` as history state,
 * and the theme selects the open entry by the `state="selected"` attribute.
 */
function SettingsNavItem({ entry }: { entry: AppNavEntry }) {
  const matchRoute = useMatchRoute();
  const selected = !!matchRoute({ to: entry.to as never });
  const linkProps = useLinkProps({ to: entry.to as never });
  return (
    <a
      {...linkProps}
      data-testid={`settings-nav-${entry.id}`}
      aria-current={selected ? "page" : undefined}
      element="control--sidebar-item"
      state={selected ? "selected" : undefined}
    >
      <Stack dir="row" align="center" gap={8}>
        <Icon name={entry.icon} size="sm" />
        {entry.title}
      </Stack>
    </a>
  );
}
