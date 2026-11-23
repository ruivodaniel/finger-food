/**
 * SettingsNav — the settings section's own left panel: one item per entry it is given, the current one selected. The entries are
 * the navigation projection of the route declaration (navOf); the icons are this navigation's own, by path. It never reads the router.
 */
import { Icon, type IconName } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { NavEntry } from "@libs/web-routing";
import { mounted } from "../../services/application/mount";

const ICONS: Record<string, IconName> = {
  account: "mail",
  profile: "user",
  security: "lock",
  legal: "bookOpen",
  preferences: "settings",
  notifications: "bell",
  billing: "tag",
  credits: "activity",
};

export interface SettingsNavProps {
  entries: NavEntry[];
  /** The router's current path: the entry whose `to` it is, is the selected one. */
  current: string;
}

export function SettingsNav({ entries, current }: SettingsNavProps) {
  const { router } = mounted();
  return (
    <nav data-testid="settings-nav" element="control-group--sidebar">
      <Stack dir="col" scale="2xs">
        {entries.map((entry) => {
          const selected = current === entry.to;
          return (
            <a
              key={entry.path}
              href={entry.to}
              data-testid={`settings-nav-${entry.path}`}
              aria-current={selected ? "page" : undefined}
              element="control--sidebar-item"
              state={selected ? "selected" : undefined}
              onClick={(e) => {
                e.preventDefault();
                if (!selected) void router?.navigate({ to: entry.to });
              }}
            >
              <Stack dir="row" align="center" scale="sm">
                <Icon name={ICONS[entry.path] ?? "settings"} scale="sm" />
                {entry.title}
              </Stack>
            </a>
          );
        })}
      </Stack>
    </nav>
  );
}
