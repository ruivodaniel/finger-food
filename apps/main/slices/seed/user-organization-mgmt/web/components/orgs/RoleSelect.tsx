/**
 * RoleSelect — pick membership roles for an org type. A dropdown of checkbox
 * items over the injected catalog (config.roleCatalog[orgType]) — the same
 * DropdownMenu the OrgSwitcher uses, multi-select. When the app ships no
 * catalog for the type, it falls back to comma-separated free text so unwired
 * products still work. The server owns enforcement — this only shapes what
 * the UI offers. The trigger is a secondary, full-width Button with a
 * chevron.
 *
 * AC(availability-check): member.role.update — every catalog role is offered;
 * availability-check narrows the options from the engine's rules.
 */

import * as React from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Input,
} from "@libs/web-components";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";

export interface RoleSelectProps {
  orgType: string | undefined;
  value: string[];
  onChange: (roles: string[]) => void;
  testId: string;
}

export function RoleSelect({
  orgType,
  value,
  onChange,
  testId,
}: RoleSelectProps): React.ReactElement {
  const { config } = useUserOrgMgmtContext();
  const options = (orgType && config.roleCatalog?.[orgType]) || [];

  if (options.length === 0) {
    return (
      <Input
        data-testid={testId}
        value={value.join(", ")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean),
          )
        }
        placeholder="role1, role2"
      />
    );
  }

  const toggle = (role: string, checked: boolean) =>
    onChange(checked ? [...value, role] : value.filter((r) => r !== role));

  const summary = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label)
    .join(", ");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          data-testid={testId}
          emphasis="secondary"
          buttonType="text-icon"
          endIcon="chevronDown"
          fill
          className="justify-between"
        >
          {summary || "Select roles"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            data-testid={`${testId}-${option.value}`}
            checked={value.includes(option.value)}
            // Keep the menu open so several roles can be toggled in one pass.
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) => toggle(option.value, checked === true)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
